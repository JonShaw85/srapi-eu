const league = require('../models/playerleagueschema')
const notifications = require('./messages/notifications')
const schedule = require('node-schedule')
const uuid = require('node-uuid')
const user = require('../models/user')
const Auth = require('../controllers/methods/auth')
const Utils = require('./playerleagueutils')
const moment = require('moment')



var League = {

    start: function (req, res) {
        var username = req.body.username
        var elo = req.body.elo
        var eloNum = Number(elo)


        console.log('[Player League] Player starting - ' + username + ' with elo - ' + elo)

        var createNewLeague = function (username) {
            console.log('[Player League] Create new league - ' + username)
            var newLeague = new league()

            var creationTime = moment().utc()
            var expireTime = moment(creationTime).add(3, 'days').toDate()

            var newId = uuid.v4()
            newLeague.league_id = newId
            newLeague.creationTime = creationTime
            newLeague.expiryTime = expireTime
            newLeague.hasExpired = false
            newLeague.numPlayers = 1
            newLeague.devLeague = false
            newLeague.players.push({
                username: username,
                elo: eloNum,
                lp: 0,
                eloReward: 0,
                xpReward: 0,
                srdReward: 0,
                isOnWinStreak: false,
                ownsLpBoost: false,
                ownsLpShield: false
            })

            var scheduleCronJobs = function (id) {

                var expireDate = expireTime
                console.log('[Player League] Schedule league expiry for game ' + id + ' at .. ' + expireDate)

                /// REMOVE LEAGUE FROM DB AFTER 24 HOURS
                var removeLeagueFromDb = function (leagueId) {

                    var removeMeDate = moment().utc().add(3, 'days').toDate()
                    console.log('[Player League] Schedule deletion for league ' + leagueId + ' at ' + removeMeDate)

                    var task = schedule.scheduleJob(removeMeDate, function (leagueId) {
                        return league.deleteOne({ league_id: leagueId }, {}, function (err, result) {
                            if (result) {
                                console.log('[Player League] deleted game ' + leagueId)
                            } else {
                                console.log('[Player League] delete game ' + leagueId + ' no result')
                            }
                        })
                    }.bind(null, leagueId))
                }

                //EXPIRE LEAGUE AFTER TIME
                var task = schedule.scheduleJob(expireDate, function (id) {
                    console.log('[Player League] - Expiring Game: ' + id)

                    return league.findOneAndUpdate({ league_id: id }, {}, function (err, result) {
                        if (result) {
                            result.hasExpired = true
                            result.players.sort((a, b) => (a.lp < b.lp) ? 1 : -1)

                            //Loop through players and set rewards
                            for (let i = 0; i < result.players.length; i++) {
                                const player = result.players[i];

                                var finishingPosition = i + 1
                                var eloReward = Utils.calculateEloReward(player.elo, finishingPosition)
                                var xpReward = Utils.calculateXpReward(finishingPosition)
                                var srdReward = Utils.calculateSrdReward(finishingPosition)

                                console.log('[Player League] Elo reward for ' + player.username + ' is ' + eloReward)

                                player.eloReward = eloReward
                                player.xpReward = xpReward
                                player.srdReward = srdReward
                            }

                            result.save()
                            //Call to remove the league from DB after 24 hours
                            removeLeagueFromDb(id)

                        } else {
                            console.log('[Player League] league not found.. ' + id)
                        }
                    })
                }.bind(null, id))
            }

            //Schedule game expiry
            scheduleCronJobs(newId)

            newLeague.save()

            console.log('[Player League] Created league! - ' + newId)
            const notification = notifications.refreshedLeagueState
            notification.league = newLeague
            notification.league_id = newId

            return res.status(200).json(notification)
        }

        var joinLeague = function (league, username, elo) {
            console.log('[Player League] Joining league - ' + league.league_id + ' adding username ' + username)

            var playerAlreadyInLeague = false

            league.players.forEach(player => {
                if (player.username === username) {
                    playerAlreadyInLeague = true
                }
            });

            //Only add the player to the league if they arent already in there, if not just send the league reference back
            if (!playerAlreadyInLeague) {
                league.players.push({
                    username: username,
                    elo: elo,
                    lp: 0,
                    eloReward: 0,
                    xpReward: 0,
                    srdReward: 0,
                    isOnWinStreak: false,
                    ownsLpBoost: false,
                    ownsLpShield: false
                })

                league.numPlayers = league.numPlayers + 1
            }

            if (league.players.length > 1) {
                league.players.sort((a, b) => (a.lp < b.lp) ? 1 : -1)
            }

            league.save()

            const notification = notifications.refreshedLeagueState
            notification.league = league
            notification.league_id = league.league_id

            return res.status(200).json(notification)
        }

        //Attempt to find a game to join
        return league.findOne({ $and: [{ numPlayers: { $lt: 100 } }, { hasExpired: false }, { devLeague: false }] }, function (err, league) {
            //console.log('[Player League] Start Find One - Errors : ' + err + ' , league : ' + league)

            if (!league) {
                //Create a league
                return createNewLeague(username)
            } else {
                //Join existing league 
                return joinLeague(league, username, eloNum)
            }
        })
    },

    postEloUpdate: function (req, res) {
        var username = req.body.username
        var elo = req.body.elo
        var eloNum = Number(elo)
        var lp = req.body.lp
        var lpNum = Number(lp)
        var leagueId = req.body.leagueId

        var lpBoost = req.body.lpBoost
        var lpShield = req.body.lpShield
        var winStreak = req.body.winStreak
        var ownsLpBoost = (lpBoost == 'True')
        var ownsLpShield = (lpShield == 'True')
        var ownsWinStreak = (winStreak == 'True')

        console.log('[Player League] Post Elo Update: ' + leagueId + ' For player ' + username + ' With elo ' + eloNum)

        return league.findOneAndUpdate({ league_id: leagueId }, {}, function (err, result) {
            if (!result) {
                console.log('[Player League] Post Score Failed: ' + leagueId + ' not found')
                return res.status(400).send('League Not Found')
            }
            else {
                console.log('[Player League] League found with ' + result.players.length + ' players')

                for (let i = 0; i < result.players.length; i++) {

                    var element = result.players[i];
                    console.log('[Player League] Found Player ' + element.username)

                    if (element.username == username) {
                        console.log('[Player League] Found player ' + element.username + ' Posting elo of ' + eloNum)

                        result.players.set(i, { username: username, elo: eloNum, lp: lpNum, eloReward: 0, ownsLpBoost: ownsLpBoost, ownsLpShield: ownsLpShield, onWinStreak: ownsWinStreak })
                        break
                    }
                }

                if (result.players.length > 1) {
                    result.players.sort((a, b) => (a.lp < b.lp) ? 1 : -1)
                }

                //Loop through the players after the sort and check for position changes
                for (let index = 0; index < result.players.length; index++) {
                    let player = result.players[index]
                    let newPosition = index + 1
                    let currentPos = result.players[index].currentPosition
                    let lastPos = result.players[index].lastPosition

                    if (newPosition != result.players[index].currentPosition) {
                        result.players[index].lastPosition = currentPos
                    }
                    result.players[index].currentPosition = newPosition

                    console.log("League -- " + player.username + " Old position: " + result.players[index].lastPosition + " New Position: " + result.players[index].currentPosition)

                }

                result.save(function (err) {
                    if (!err) {
                        console.log('[Player League] Players elo updated successfully')
                    } else {
                        console.log('[Player League] Post elo error: ' + err)
                    }
                })
            }

            console.log('[Player League] Post elo update complete')
            const notification = notifications.refreshedLeagueState;
            notification.league = result
            notification.league_id = result.league_id

            return (res.status(200).json(notification))
        })
    },

    refreshLeagueState: function (req, res) {
        var leagueId = req.body.leagueId

        if (leagueId == '' || leagueId == undefined) {
            console.log('Game ID Not found error')
            return res.status(500).send('Game ID is undefined')
        }

        console.log('[Player League] Refreshing league state for league : ' + leagueId)

        return league.findOne({ league_id: leagueId }, function (err, result) {
            if (err) {
                console.log('League not found error')
                return res.status(500).send(err)
            }

            return result
        }).then(function (league) {
            if (league != undefined) {
                //console.log('[Player League] Refresh returning league: ' + JSON.stringify(league))

                if (league.players.length > 1) {
                    league.players.sort((a, b) => (a.lp < b.lp) ? 1 : -1)
                }
            }

            const notification = notifications.refreshedLeagueState
            notification.league = league
            notification.league_id = league.league_id

            return res.status(200).json(notification)
        }).caught(function (error) {
            return res.status(500).json(error)
        })
    },

    claimElo: function (req, res) {
        var username = req.body.username

        var eloReward = req.body.elo
        var eloNum = Number(eloReward)

        var xpReward = req.body.xp
        var xpNum = Number(xpReward)

        var srdReward = req.body.srd
        var srdNum = Number(srdReward)

        Auth.findUserByUsername(username).then((user) => {
            if (user) {
                console.log('[Player League] Updating elo for user ' + username + ' with reward ' + eloNum)
                if (eloNum) user.elo += eloNum
                if (xpNum) user.xp += xpNum
                if (srdNum) user.srd += srdNum

                user.save()
                return res.status(200).send('Success')
            } else {
                return res.status(400).send('Error')
            }
        })
    },

    forceExpireLeague: function (req, res) {
        var leagueId = req.body.leagueId
        var TimeNowString = req.body.NowTime

        console.log('[Force Expire Legaue] Expiring league with id: ' + leagueId)

        var clientTime = moment(TimeNowString)
        var maxServerTime = moment().utc().add(5, 'minutes')
        var minServerTime = moment().utc().subtract(5, 'minutes')

        var IsAfterServerTime = clientTime.isAfter(maxServerTime)
        var IsBeforeServerTime = clientTime.isBefore(minServerTime)

        if (IsAfterServerTime || IsBeforeServerTime) {
            console.log('Force exipre league :: CHEATER -- dont force expire the league')
            return res.status(400).send()
        }

        var removeLeagueFromDb = function (leagueId) {

            var removeMeDate = moment().utc().add(3, 'days').toDate() //Remove after 24 hours
            console.log('[Player League] Schedule deletion for league ' + leagueId + ' at ' + removeMeDate)

            var task = schedule.scheduleJob(removeMeDate, function (leagueId) {
                return league.deleteOne({ league_id: leagueId }, {}, function (err, result) {
                    if (result) {
                        console.log('[Player League] deleted game ' + leagueId)
                    } else {
                        console.log('[Player League] delete game ' + leagueId + ' no result')
                    }
                })
            }.bind(null, leagueId))
        }

        league.findOneAndUpdate({ league_id: leagueId }, {}, function (error, result) {
            if (result) {
                result.hasExpired = true
                result.players.sort((a, b) => (a.lp < b.lp) ? 1 : -1)

                //Loop through players and set rewards
                for (let i = 0; i < result.players.length; i++) {
                    const player = result.players[i];

                    var finishingPosition = i + 1
                    var eloReward = Utils.calculateEloReward(player.elo, finishingPosition)
                    var xpReward = Utils.calculateXpReward(finishingPosition)
                    var srdReward = Utils.calculateSrdReward(finishingPosition)

                    console.log('[Player League] Elo reward for ' + player.username + ' is ' + eloReward)
                    player.eloReward = eloReward
                    player.xpReward = xpReward
                    player.srdReward = srdReward;
                }

                result.save()
                //Call to remove the league from DB after 24 hours
                removeLeagueFromDb(leagueId)
                return res.status(200).send('success')

            } else if (error) {
                console.log('[Force Expire League] Error ' + error)
                return res.status(500).json({ Error: error })
            }
        })
    },

    buyLpBoost: function (req, res) {
        var username = req.body.username
        var srdCost = req.body.srdCost
        var srdCostNum = Number(srdCost)
        var leagueId = req.body.leagueId;

        Auth.findUserByUsername(username).then((user) => {
            if (user) {
                console.log('[Player League] Buying Elo Boost :' + username)
                user.srd -= srdCostNum
                user.save()
            } else {
                return res.status(400).send('Error')
            }
        })

        league.findOneAndUpdate({ league_id: leagueId }, {}, function (error, result) {
            if (!result) {
                return res.status(400).send('Error')
            } else {
                result.players.forEach(player => {
                    if (player.username == username) {
                        console.log('[Player League] Buying Elo Boost User found' + player.username)
                        player.ownsLpBoost = true
                    }
                });

                return res.status(200).send('Success')
            }
        })
    },

    buyLpShield: function (req, res) {
        var username = req.body.username
        var srdCost = req.body.srdCost
        var srdCostNum = Number(srdCost)
        var leagueId = req.body.leagueId;
        var ShieldCount = req.body.ShieldCount
        Auth.findUserByUsername(username).then((user) => {
            if (user) {
                console.log('[Player League] Buying Elo Shield :' + username)
                user.srd -= srdCostNum
                user.save()
            } else {
                return res.status(400).send('Error')
            }
        })

        league.findOneAndUpdate({ league_id: leagueId }, {}, function (error, result) {
            if (!result) {
                return res.status(400).send('Error')
            } else {
                result.players.forEach(player => {
                    if (player.username == username) {
                        console.log('[Player League] Buying Elo Shield User found' + player.username)
                        player.ownsLpShield = true
                    }
                });

                return res.status(200).json({ shieldCount: ShieldCount })
            }
        })
    },

    devStart: function (req, res) {
        var username = req.body.username
        var elo = req.body.elo
        var eloNum = Number(elo)


        console.log('[Player League] Player starting - ' + username + ' with elo - ' + elo)

        var createNewLeague = function (username) {
            console.log('[Player League] Create new league - ' + username)
            var newLeague = new league()

            var creationTime = moment().utc()
            var expireTime = moment(creationTime).add(10, 'minutes').toDate()

            var newId = uuid.v4()
            newLeague.league_id = newId
            newLeague.creationTime = creationTime
            newLeague.expiryTime = expireTime
            newLeague.hasExpired = false
            newLeague.numPlayers = 1
            newLeague.devLeague = true
            newLeague.players.push({
                username: username,
                elo: eloNum,
                lp: 0,
                eloReward: 0,
                xpReward: 0,
                srdReward: 0,
                isOnWinStreak: false,
                ownsLpBoost: false,
                ownsLpShield: false
            })

            var scheduleCronJobs = function (id) {

                var expireDate = expireTime
                console.log('[Player League] Schedule league expiry for game ' + id + ' at .. ' + expireDate)

                /// REMOVE LEAGUE FROM DB AFTER 24 HOURS
                var removeLeagueFromDb = function (leagueId) {

                    var removeMeDate = moment().utc().add(1, 'hour').toDate()
                    console.log('[Player League] Schedule deletion for league ' + leagueId + ' at ' + removeMeDate)

                    var task = schedule.scheduleJob(removeMeDate, function (leagueId) {
                        return league.deleteOne({ league_id: leagueId }, {}, function (err, result) {
                            if (result) {
                                console.log('[Player League] deleted game ' + leagueId)
                            } else {
                                console.log('[Player League] delete game ' + leagueId + ' no result')
                            }
                        })
                    }.bind(null, leagueId))
                }

                //EXPIRE LEAGUE AFTER TIME
                var task = schedule.scheduleJob(expireDate, function (id) {
                    console.log('[Player League] - Expiring Game: ' + id)

                    return league.findOneAndUpdate({ league_id: id }, {}, function (err, result) {
                        if (result) {
                            result.hasExpired = true
                            result.players.sort((a, b) => (a.lp < b.lp) ? 1 : -1)

                            //Loop through players and set rewards
                            for (let i = 0; i < result.players.length; i++) {
                                const player = result.players[i];

                                var finishingPosition = i + 1
                                var eloReward = Utils.calculateEloReward(player.elo, finishingPosition)
                                var xpReward = Utils.calculateXpReward(finishingPosition)
                                var srdReward = Utils.calculateSrdReward(finishingPosition)

                                console.log('[Player League] Elo reward for ' + player.username + ' is ' + eloReward)

                                player.eloReward = eloReward
                                player.xpReward = xpReward
                                player.srdReward = srdReward
                            }

                            result.save()
                            //Call to remove the league from DB after 24 hours
                            removeLeagueFromDb(id)

                        } else {
                            console.log('[Player League] league not found.. ' + id)
                        }
                    })
                }.bind(null, id))
            }

            //Schedule game expiry
            scheduleCronJobs(newId)

            newLeague.save()

            console.log('[Player League] Created league! - ' + newId)
            const notification = notifications.refreshedLeagueState
            notification.league = newLeague
            notification.league_id = newId

            return res.status(200).json(notification)
        }

        var joinLeague = function (league, username, elo) {
            console.log('[Player League] Joining league - ' + league.league_id + ' adding username ' + username)

            var playerAlreadyInLeague = false

            league.players.forEach(player => {
                if (player.username === username) {
                    playerAlreadyInLeague = true
                }
            });

            //Only add the player to the league if they arent already in there, if not just send the league reference back
            if (!playerAlreadyInLeague) {
                league.players.push({
                    username: username,
                    elo: elo,
                    lp: 0,
                    eloReward: 0,
                    xpReward: 0,
                    srdReward: 0,
                    isOnWinStreak: false,
                    ownsLpBoost: false,
                    ownsLpShield: false
                })

                league.numPlayers = league.numPlayers + 1
            }

            if (league.players.length > 1) {
                league.players.sort((a, b) => (a.lp < b.lp) ? 1 : -1)
            }

            league.save()

            const notification = notifications.refreshedLeagueState
            notification.league = league
            notification.league_id = league.league_id

            return res.status(200).json(notification)
        }

        //Attempt to find a game to join
        return league.findOne({ $and: [{ numPlayers: { $lt: 100 } }, { hasExpired: false }, { devLeague: true }] }, function (err, league) {
            //console.log('[Player League] Start Find One - Errors : ' + err + ' , league : ' + league)

            if (!league) {
                //Create a league
                return createNewLeague(username)
            } else {
                //Join existing league 
                return joinLeague(league, username, eloNum)
            }
        })
    },

    devExpire: function (req, res) {
        var leagueId = req.body.leagueId

        var removeLeagueFromDb = function (leagueId) {

            var removeMeDate = moment().utc().add(1, 'hour').toDate() //Remove after 24 hours
            console.log('[Player League] Schedule deletion for league ' + leagueId + ' at ' + removeMeDate)

            var task = schedule.scheduleJob(removeMeDate, function (leagueId) {
                return league.deleteOne({ league_id: leagueId }, {}, function (err, result) {
                    if (result) {
                        console.log('[Player League] deleted game ' + leagueId)
                    } else {
                        console.log('[Player League] delete game ' + leagueId + ' no result')
                    }
                })
            }.bind(null, leagueId))
        }

        league.findOneAndUpdate({ league_id: leagueId }, {}, function (error, result) {
            if (result) {
                result.hasExpired = true
                result.players.sort((a, b) => (a.lp < b.lp) ? 1 : -1)

                //Loop through players and set rewards
                for (let i = 0; i < result.players.length; i++) {
                    const player = result.players[i];

                    var finishingPosition = i + 1
                    var eloReward = Utils.calculateEloReward(player.elo, finishingPosition)
                    var xpReward = Utils.calculateXpReward(finishingPosition)
                    var srdReward = Utils.calculateSrdReward(finishingPosition)

                    console.log('[Player League] Elo reward for ' + player.username + ' is ' + eloReward)
                    player.eloReward = eloReward
                    player.xpReward = xpReward
                    player.srdReward = srdReward;
                }

                result.save()
                //Call to remove the league from DB after 24 hours
                removeLeagueFromDb(leagueId)
                return res.status(200).send('success')

            } else if (error) {
                console.log('[Force Expire League] Error ' + error)
                return res.status(500).json({ Error: error })
            }
        })
    }
}

module.exports = League