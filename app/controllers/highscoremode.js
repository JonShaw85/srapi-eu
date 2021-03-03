var Promise = require('bluebird');
var Game = require('../models/highscoregame');
var notifications = require('./messages/notifications');
var errors = require('./messages/errors');
var uuid = require('node-uuid');
var schedule = require('node-schedule');
var Auth = require('./methods/auth');
var moment = require('moment')
var Notie = require('./PushNotification');

var Mode = {

    claim: function (req, res) {
        var game_id = req.body.game_id;
        var index = req.body.index;
        var username = req.body.username;

        var srd_reward = 0;
        var xp_reward = 0;

        Auth.findUserByUsername(username).then(function (user) {
            var resultindex = -1;
            for (var i = 0; i < user.highscoreresults.length; i++) {
                var result = user.highscoreresults[i];
                if (result.game_id == game_id) {
                    srd_reward = result.srd_reward;
                    xp_reward = result.xp_reward;
                    resultindex = i;
                    break;
                }
            }

            if (resultindex != -1) {
                user.highscoreresults.splice(resultindex, 1);
                user.save();
            }

            const notification = notifications.claimedHighScoreReward;
            notification.game_id = game_id;
            notification.gameIndex = index;
            notification.srd = srd_reward;
            notification.xp = xp_reward;

            console.log("[Mode] claiming reward: " + username + " , game_id: " + game_id + " , srd: " + srd_reward + " , xp: " + xp_reward);

            return res.status(200).json(notification);

        }).caught(function (error) {
            console.log('[Mode] claiming reward error : ' + error);
            return res.status(500).json(error);
        });

    },

    refreshGameState: function (req, res) {
        var game_id = req.body.game_id;
        var index = req.body.index;

        //if(game_id == '' || gameId == undefined) {
        //    console.log('Game ID Not found error')
        //    return res.status(500).send('Game ID is undefined')
        //}

        console.log("[Mode] refreshGameState: " + game_id);

        return Game.findOne({ game_id: game_id }, function (err, game) {
            if (err) {
                console.log('Game Not found error')
                return res.status(500).send('Game Not Found');
            }

            return game;

        }).then(function (game) {

            if (game != undefined) {
                //console.log("[Mode] refreshGameState returning game: " + JSON.stringify(game));

                if (game.players.length > 1) {
                    game.players.sort((a, b) => (a.score < b.score) ? 1 : -1);
                }
                game.save()
            }

            const notification = notifications.refreshedHighScoreGameState;
            notification.game = game;
            notification.gameIndex = index;

            return res.status(200).json(notification);

        }).caught(function (error) {
            return res.status(500).json(error);
        });
    },

    forceExpireGame: function (req, res) {
        var id = req.body.id

        var TimeNowString = req.body.NowTime

        console.log('[Force Expire Game] Expiring league with id: ' + id)

        var clientTime = moment(TimeNowString)
        var maxServerTime = moment().utc().add(5, 'minutes')
        var minServerTime = moment().utc().subtract(5, 'minutes')

        var IsAfterServerTime = clientTime.isAfter(maxServerTime)
        var IsBeforeServerTime = clientTime.isBefore(minServerTime)

        if (IsAfterServerTime || IsBeforeServerTime) {
            console.log('Force exipre league :: CHEATER -- dont force expire the league')
            return res.status(400).send()
        }

        console.log('Force exipre game :: Expiring game with id : ' + id)

        Game.findOneAndUpdate({ game_id: id }, {}, (err, result) => {
            if (result) {
                result.hasExpired = true
                result.players.sort((a, b) => (a.score, b.score) ? 1 : -1)
                result.save();

                console.log("---- Setting results for players ----- ")
                // Calculate finishing position
                let p = 0;
                var results = {}; // An empty object to contain results [Username] : 1
                result.players.forEach(player => {

                    let username = player.user_id
                    p += 1
                    results[username] = p

                    console.log("Adding: " + username + "Position: " + Number(results[username]))
                })

                console.log("------------------- ")

                result.players.forEach(player => {
                    let username = player.user_id
                    console.log('Force Expire - ' + username)

                    Auth.findUserByUsername(username).then((user) => {

                        if (user) {
                            console.log('Force Expire -- User - ' + username + ' FOUND')
                        } else {
                            console.log('Force Expire -- User - ' + username + ' NOT FOUND')
                        }

                        let finishPos = Number(results[user.username])

                        console.log("Force Expire - Finish pos for " + username + ' is ' + finishPos)

                        var srd_reward = 0;
                        var xp_reward = 0;

                        //Calculate srd reward based on finshing position
                        if (finishPos <= 1) {
                            srd_reward = 10000
                            xp_reward = 500
                        } else if (finishPos < 4) {
                            srd_reward = 8000
                            xp_reward = 350
                        } else if (finishPos < 7) {
                            srd_reward = 3000
                            xp_reward = 250
                        } else if (finishPos < 11) {
                            srd_reward = 1000
                            xp_reward = 170
                        }

                        console.log('Reward for ' + username + ' For position ' + finishPos + ' is ' + srd_reward);
                        user.highscoreresults.push({ game_id: id, finishing_pos: finishPos, srd_reward: srd_reward, xp_reward: xp_reward });

                        user.save();
                    })
                });

                return res.status(200).send('success')
            }
            else {
                return res.status(500).send('Error')
            }
        })
    },

    start: function (req, res) {
        var param_player = req.body.username;
        var index = req.body.index;

        var game_id_1 = req.body.game_id_1 || "";
        var game_id_2 = req.body.game_id_2 || "";
        var game_id_3 = req.body.game_id_3 || "";

        var activeGames = [];

        activeGames.push(game_id_1);
        activeGames.push(game_id_2);
        activeGames.push(game_id_3);

        console.log("[Mode] start - active games = " + JSON.stringify(activeGames));

        var createNewGame = function (username, index) {
            console.log("[Mode] createNewGame - username: " + username);

            function getRandomInt(min, max) {
                min = Math.ceil(min);
                max = Math.floor(max);
                console.log('[Mode] Getting random number between ' + min + ' and ' + max)
                var finalNum = Math.floor(Math.random() * (max - min) + min);
                console.log('[Mode] Getting random number between returned' + finalNum)
                return finalNum; //The maximum is exclusive and the minimum is inclusive
            }

            var game = new Game();

            game.arena = getRandomInt(0, 2);

            game.hasExpired = false;

            game.timestamp = Date.now();

            var game_id = uuid.v4();

            game.game_id = game_id;

            game.players.push({ user_id: username, score: 0, elo: 0, currentPosition: 0, lastPosition: 0 });

            game.numPlayers = 1;

            var ScheduleCronJob = function (expire_id) {
                var jobDate = new Date(Date.now() + (24 * 60 * 60000)); //expire after 10 hrs - If you want 10 mins ---> (1*10*60000)); <--- ::: //10 hours ---> (10*60*60000)) <--- 

                console.log('ScheduleCronJob for EXPIRY game ' + expire_id + " at .. " + jobDate);

                var RemoveGameFromDB = function (game_id) {
                    var removeMeDate = new Date(Date.now() + (24 * 60 * 60000)); //remove after 24 hrs

                    console.log('ScheduleCronJob for DELETION game' + game_id + " at .. " + removeMeDate);

                    var task = schedule.scheduleJob(removeMeDate, function (game_id) {
                        return Game.deleteOne({ game_id: game_id }, {}, function (err, result) {
                            if (result) {
                                console.log("[Cron Job - RemoveGameFromDB] deleted game: " + game_id + " from the database!");
                            }
                            else {
                                console.log("[Cron Job - RemoveGameFromDB] delete game: " + game_id + " FAILED!");
                            }

                        });

                    }.bind(null, game_id)); // the bind allows the expire_id to pass through into the job function

                }

                var task = schedule.scheduleJob(jobDate, function (expire_id) {
                    console.log("Cron job initiated - EXPIRING game: " + expire_id);

                    return Game.findOneAndUpdate({ game_id: expire_id }, {}, function (err, result) {
                        if (result) {
                            console.log("[Cron job] found game.." + expire_id);
                            result.hasExpired = true;
                            result.players.sort((a, b) => (a.score < b.score) ? 1 : -1);
                            result.save();

                            console.log("---- Setting results for players ----- ")
                            // Calculate finishing position
                            let p = 0;
                            var results = {}; // An empty object to contain results [Username] : 1
                            result.players.forEach(player => {

                                let username = player.user_id
                                p += 1
                                results[username] = p

                                console.log("Adding: " + username + "Position: " + Number(results[username]))
                            })

                            console.log("------------------- ")

                            result.players.forEach(player => {
                                let username = player.user_id
                                console.log('Force Expire - ' + username)

                                Auth.findUserByUsername(username).then((user) => {

                                    if (user) {
                                        console.log('Force Expire -- User - ' + username + ' FOUND')
                                    } else {
                                        console.log('Force Expire -- User - ' + username + ' NOT FOUND')
                                    }

                                    let finishPos = Number(results[user.username])

                                    console.log("Force Expire - Finish pos for " + username + ' is ' + finishPos)

                                    var srd_reward = 0;
                                    var xp_reward = 0;

                                    //Calculate srd reward based on finshing position
                                    if (finishPos <= 1) {
                                        srd_reward = 8000
                                        xp_reward = 500
                                    } else if (finishPos < 4) {
                                        srd_reward = 4000
                                        xp_reward = 350
                                    } else if (finishPos < 7) {
                                        srd_reward = 2000
                                        xp_reward = 250
                                    } else if (finishPos < 11) {
                                        srd_reward = 1000
                                        xp_reward = 170
                                    }

                                    console.log('Reward for ' + username + ' For position ' + finishPos + ' is ' + srd_reward);
                                    user.highscoreresults.push({ game_id: expire_id, finishing_pos: finishPos, srd_reward: srd_reward, xp_reward: xp_reward });

                                    user.save();
                                })
                            });

                            //trigger game deletion..
                            RemoveGameFromDB(expire_id);
                        }
                        else {
                            console.log("[Cron job] game not found.." + expire_id);
                        }
                    });

                }.bind(null, expire_id)); // the bind allows the expire_id to pass through into the job function

            }

            //Trigger game expiry
            ScheduleCronJob(game_id);

            game.save();

            const notification = notifications.refreshedHighScoreGameState;
            console.log("[Mode] start - created game: " + JSON.stringify(game));
            notification.game = game;
            notification.gameIndex = index;
            return res.status(200).json(notification);
        }

        var joinGame = function (game, username, index) {

            console.log("[Mode] joinGame - game_id: " + game.game_id + " , adding username: " + username);

            game.players.push({ user_id: username, score: 0, elo: 0, currentPosition: 0, lastPosition: 0 });

            game.numPlayers = game.numPlayers + 1;

            if (game.players.length > 1) {
                game.players.sort((a, b) => (a.score < b.score) ? 1 : -1);
            }
            game.save();

            const notification = notifications.refreshedHighScoreGameState;
            console.log("[Mode] start - joined game: " + JSON.stringify(game));
            notification.game = game;
            notification.gameIndex = index;
            return res.status(200).json(notification);
        }

        return Game.findOne({ $and: [{ numPlayers: { $lt: 12 } }, { game_id: { $nin: activeGames } }, { hasExpired: false }] }, function (err, game) {
            console.log("[Mode] start findOne - err: " + err + " , game: " + JSON.stringify(game));

            if (!game) {
                // Create game
                return createNewGame(param_player, index);
            }
            else {
                return joinGame(game, param_player, index);
            }
        });
    },

    postScore: function (req, res) {
        var param_score = req.body.score;
        var param_player = req.body.username;
        var param_game_id = req.body.game_id;
        var index = req.body.index;
        var param_elo = req.body.elo;

        var card_id_1 = Number(req.body.card_id_1) || -1;
        var card_id_2 = Number(req.body.card_id_2) || -1;
        var card_id_3 = Number(req.body.card_id_3) || -1;

        var usedCards = [];
        usedCards.push({ card_id: card_id_1 });
        usedCards.push({ card_id: card_id_2 });
        usedCards.push({ card_id: card_id_3 });

        console.log("[Mode] postScore: game with id " + param_game_id + " , username: " + param_player + " , score: " + param_score);

        return Game.findOneAndUpdate({ game_id: param_game_id }, {}, function (err, result) {
            if (!result) {
                console.log("[Mode] postScore: game with id " + param_game_id + " NOT FOUND");
                return res.status(400).json(errors.GameNotFoundError);
            }
            else {
                console.log("[Mode] postScore: game.players.length: " + result.players.length);
                for (var i = 0; i < result.players.length; i++) {
                    console.log("[Mode] postScore: game.players[i].user_id " + result.players[i].user_id + " comparing against : " + param_player);


                    if (result.players[i].user_id == param_player) {
                        var score = Number(param_score);
                        var storedScore = Number(result.players[i].score);
                        var elo = Number(param_elo);

                        console.log("[Mode] postScore: score " + score + " storedScore: " + storedScore);

                        if (score > storedScore) {
                            result.players.set(i, { user_id: param_player, score: score, cards: usedCards, elo: elo });

                            //  result.players[i].score = score;
                            console.log("[Mode] postScore: setting " + param_player + " score to : " + param_score);
                        }
                        else {
                            console.log("[Mode] postScore: leaderboard score is higher so not updating!");
                        }
                        break;
                    }
                }

                if (result.players.length > 1) {
                    result.players.sort((a, b) => (a.score < b.score) ? 1 : -1);
                }
                var CurrentPos = 0;
                var LastPos = 0;
                //TODO Loop through the players here and reset the current position, so we can see if there is a difference after the sort
                for (let index = 0; index < result.players.length; index++) {
                    const player = result.players[index];

                    let position = index + 1
                    if (position != result.players[index].currentPosition) {
                        result.players[index].lastPosition = result.players[index].currentPosition;
                    }
                    result.players[index].currentPosition = position;
                    if (result.players[index].user_id == param_player) {
                        CurrentPos = result.players[index].currentPosition
                        LastPos = result.players[index].lastPosition
                    }
                    console.log("Highscore -- " + player.user_id + " Old position: " + result.players[index].lastPosition + " New Position: " + result.players[index].currentPosition)


                    //TODO here we can check if the position has gone down, and the player[index - 1] will be the overtaking player
                }
                for (let j = CurrentPos + 1; j < LastPos; j++) {
                    if (result.players[j] != undefined && result.players[j].canBeNotified == true) {
                        Notie.SendNotification(result.players[j].user_id, param_player, param_score)
                        result.players[j].canBeNotified = false;
                    }
                }
                result.save(function (err) {
                    if (!err) {
                        console.log("postScore: game saved!");
                    }
                    else {
                        console.log("postScore ERROR: could not save game " + result.game_id);
                    }

                });
            }

            Auth.findUserByUsername(param_player).then((user) => {
                if (user) {
                    console.log('[Highscore] Checking player highscore :' + param_player)

                    var previousHs = user.bestHighscore
                    if (previousHs < param_score) {
                        console.log('[Highscore] Player ' + param_player + ' has new highscore of :' + param_score)
                        user.bestHighscore = param_score
                    }

                    user.save()
                } else {
                    return res.status(400).send('Error')
                }
            })

            console.log("[Mode] postScore returning game: " + JSON.stringify(result));
            const notification = notifications.refreshedHighScoreGameState;
            notification.game = result;
            notification.gameIndex = index;
            return res.status(200).json(notification);

        });

    },
    AllowNotification: function (req, res) {

        var UserName = req.body.UserName
        var game1 = req.body.Game1
        var game2 = req.body.Game2
        var game3 = req.body.Game3
        Game.findOneAndUpdate({ game_id: game1 }, {}, function (err, result) {
            if (result) {
                for (let index = 0; index < result.players.length; index++) {
                    if (result.players[index].user_id == UserName) {
                        result.players[index].canBeNotified = true;
                    }
                }
            }
        })
        Game.findOneAndUpdate({ game_id: game2 }, {}, function (err, result) {
            if (result) {
                for (let index = 0; index < result.players.length; index++) {
                    if (result.players[index].user_id == UserName) {
                        result.players[index].canBeNotified = true;
                    }
                }
            }
        })
        Game.findOneAndUpdate({ game_id: game3 }, {}, function (err, result) {
            if (result) {
                for (let index = 0; index < result.players.length; index++) {
                    if (result.players[index].user_id == UserName) {
                        result.players[index].canBeNotified = true;
                    }
                }
            }
        })
        return res.status(200).send()
    }
};

module.exports = Mode;