var _ = require('lodash');
var Promise = require('bluebird');
var GameType = require('./gametype');
var User = require('./../models/user');
var Currency = require('./../controllers/currency');
var ProfileMethods = require('./../controllers/methods/profile');
var errors = require('./../controllers/messages/errors');
var notifications = require('./../controllers/messages/notifications');
var Auth = require('./../controllers/methods/auth');
var config = require('../../config')
var league = require('./../models/playerleagueschema')

// existing gametypes
var gametypes = {
	ONEVSONE: new GameType(1, '1v1'),
	TWOVSTWO: new GameType(2, '2v2'),
	THREEVSTHREE: new GameType(3, '3v3')
}

var Matchmaker = function () {
	if (!(this instanceof Matchmaker))
		return new Matchmaker;
	// Match Making Preferences
	this.prefs = {
		checkinterval: 2500,
		threshold: 250,
		threshold_increase: 250, //every 10 sec
		maxiters: 10
	};

	this.timerid = undefined
	// Start the queue processor
	this.start = function () {

	}

	this.queue = function (req, res) {
		var teamOneUsernames = req.body.teamOne
		var teamTwoUsernames = req.body.teamTwo

		console.log('Started Queue, players usernames inputted are : ' + teamOneUsernames[0] + " : " + teamTwoUsernames[0])

		var i = 0
		var j = 0
		var teamOneElo = 0
		var teamTwoElo = 0

		var startGame = function () {
			teamOneElo /= teamOneUsernames.length
			teamTwoElo /= teamTwoUsernames.length
			teamOneElo = Math.round(teamOneElo)
			teamTwoElo = Math.round(teamTwoElo)

			return res.status(200).json({
				teamOneElo: teamOneElo,
				teamTwoElo: teamTwoElo
			})
		}

		var calcTeamTwoElo = function () {
			teamTwoUsernames.forEach(username => {
				Auth.findUserByUsername(username).then((user) => {
					console.log('Found user team two : ' + user.username + ' With Elo : ' + user.elo)
					teamTwoElo += user.elo
				}).then(() => {
					j++;
					if (j == teamTwoUsernames.length) {
						startGame()
					}
				})
			});
		}

		var calcTeamOneElo = function () {
			teamOneUsernames.forEach(username => {
				Auth.findUserByUsername(username).then((user) => {
					console.log('Found user team one : ' + user.username + ' With Elo : ' + user.elo)
					teamOneElo += user.elo
				}).then(() => {
					i++;
					if (i == teamOneUsernames.length) {
						calcTeamTwoElo();
					}
				})
			});
		}

		calcTeamOneElo()
	}

	this.newMatchResult = function (req, res) {
		const teamOne = req.body.teamOneElo
		const teamTwo = req.body.teamTwoElo
		const playerElo = req.body.elo
		const username = req.body.username
		const leagueId = req.body.leagueId
		const didWin = req.body.didWin
		const wasTeamA = req.body.teamA
		const srdInput = req.body.srd
		const xpInput = req.body.xp
		const lpBoost = req.body.lpBoost
		const lpShield = req.body.lpShield
		const winStreak = req.body.winStreak

		const playerEloNum = Number(playerElo)
		const teamOneElo = Number(teamOne)
		const teamTwoElo = Number(teamTwo)
		const srd = Number(srdInput)
		const xp = Number(xpInput)
		const wonGame = (didWin == 'True')
		const isTeamA = (wasTeamA == 'True')
		const ownsLpBoost = (lpBoost == 'True')
		const ownsLpShield = (lpShield == 'True')
		const ownsWinStreak = (winStreak == 'True')

		const baseLikelyhood = 800
		const baseMultiplier = 40
		const myElo = isTeamA ? teamOneElo : teamTwoElo
		const otherElo = isTeamA ? teamTwoElo : teamOneElo

		var winExpectancy = 1 / (1 + (Math.pow(10, ((otherElo - myElo) / baseLikelyhood))))
		var winMulitplier = wonGame ? 1 : 0

		var eloToAdd = baseMultiplier * (winMulitplier - winExpectancy)

		if(wonGame && eloToAdd < config.minSrdGain) {
			eloToAdd = config.minSrdGain
		}

		var newElo = playerEloNum + eloToAdd

		console.log('[End Of Game Elo] Elo Calculations -- Username: ' + username + ' -----')
		console.log('[End Of Game Elo] Elo Calculations -- My Team Elo: ' + myElo + ' Other Team Elo: ' + otherElo)
		console.log('[End Of Game Elo] Elo Calculations -- Win Expectancy: ' + winExpectancy + ' Win Mulitplier: ' + winMulitplier)
		console.log('[End Of Game Elo] Elo Calculations -- Elo To Add: ' + eloToAdd + ' New Elo: ' + newElo)

		let lpResult = wonGame ? 10 : -5
		var didUseLpShield = false

		Auth.findUserByUsername(username).then((user) => {
			if (user) {
				console.log('[End Of Game Elo] Updating elo for user : ' + user.username + ' New elo will be ' + (user.elo + eloToAdd) + " By adding " + eloToAdd)

				if (lpResult <= 0 && ownsLpShield) {
					console.log('[End Of Game Elo]' + username + ' has lp shield active, setting lp to 0')
					didUseLpShield = true
					lpResult = 0
				}

				if (lpResult > 0) {
					console.log('[End Of Game Elo]' + username + ' Lp is greater than 0 checking for boosts')
					if (ownsLpBoost) {
						console.log('[End Of Game Elo]' + username + ' has lp Boost active, adding 10 lp')
						lpResult += config.lpBoostAmount
					}

					if (ownsWinStreak) {
						console.log('[End Of Game Elo]' + username + ' has win streak active, adding 5 lp')
						lpResult += config.winStreakBonus
					}
				}
				if(newElo <= 0)
				{
					console.log("NEW ELO IF <= 0  "+newElo)
					newElo = 0
				}
				
				user.elo = newElo
				user.srd += srd
				user.xp += xp
				user.save()

				league.findOneAndUpdate({ league_id: leagueId }, {}, function (error, result) {
					if (!result) {
						return res.status(400).send('Error')
					}
					else {
						result.players.forEach(player => {
							if (player.username == username) {
								//console.log('[End of Game Elo] Updating player on league ' + player.username)
								player.ownsLpShield = ownsLpShield
								player.ownsLpBoost = ownsLpBoost
								player.onWinStreak = ownsWinStreak
								//result.players.set(player, { username : username, isOnWinStreak : ownsWinStreak, ownsLpBoost : ownsLpBoost, ownsLpShield : ownsLpShield })
							}
						});
						//console.log('[End of Game Elo] ' + JSON.stringify(result.players))
					}
				})

				return res.status(200).json({
					eloResult: eloToAdd,
					lpResult: lpResult,
					usedLpShield: didUseLpShield
				})
			}
		})

	}

	this.queueAsTeam = function (req, res) {
	}

	this.queueAsThreeVThree = function (req, res) {

		var playerUsernames = req.body.players;

		console.log('Started Queue, players usernames inputted are : ' + playerUsernames[0] + " : " + playerUsernames[1])

		var users = []
		var i = 0
		var matchElo = 0;

		var attemptStart = function () {

			matchElo /= users.length //Calculate the average elo from everyone in the match 
			matchElo = Math.round(matchElo) //Round the match elo to the nearest int
			if (users != null) {
				console.log('3v3 Users added successfully, Avg elo for game: ' + matchElo)
				return res.status(200).json({ matchElo: matchElo })
			} else {
				return res.status(400).send('ERROR : Users are null:')
			}
		}

		//Loop through the users and add to the total match Elo, then send back message to start the game
		playerUsernames.forEach((username) => {

			Auth.findUserByUsername(username).then((user) => {
				console.log('Found user : ' + user.username + ' With Elo : ' + user.elo)
				users[i] = user._id
				matchElo += user.elo
			}).then(() => {
				if (i === playerUsernames.length - 1) {
					console.log('reached end of player loop, attempting start with users : ' + users[0] + " : " + users[1])
					attemptStart()
				}
				console.log('i = ' + i)
				i += 1
			})
		})
	}

	this.endOfMatchEloResult = function (req, res) {
		var matchElo = req.body.matchElo
		var playerElo = req.body.playerElo
		var username = req.body.username
		var leagueId = req.body.leagueId
		var didWin = req.body.didWin
		var srdInput = req.body.srd
		var xpInput = req.body.xp
		var lpBoost = req.body.lpBoost
		var lpShield = req.body.lpShield
		var winStreak = req.body.winStreak

		var wonGame = (didWin == 'True')
		var ownsLpBoost = (lpBoost == 'True')
		var ownsLpShield = (lpShield == 'True')
		var ownsWinStreak = (winStreak == 'True')
		var baseEloRate = 20
		var matchEloNum = Number(matchElo)
		var playerEloNum = Number(playerElo)
		var srd = Number(srdInput)
		var xp = Number(xpInput)
		var lpResult = 0

		var didUseLpShield = false

		if (playerEloNum == 0 || isNaN(playerEloNum)) {
			playerEloNum = 100
		}

		if (matchEloNum == 0 || isNaN(matchEloNum)) {
			matchEloNum = 100
		}


		playerEloNum = Math.round(playerEloNum)

		var eloMultiplier = matchEloNum / playerEloNum
		eloMultiplier -= 1
		eloMultiplier /= 3
		eloMultiplier += 1

		var eloResult = baseEloRate * eloMultiplier
		eloResult = Math.min(Math.max(parseInt(eloResult), 5), 35)

		if (!wonGame) {
			var difference = eloResult - baseEloRate
			eloResult = baseEloRate - difference;
		}

		console.log('[End Of Game Elo] For: ' + username + 'Match elo in: ' + matchElo)
		console.log('[End Of Game Elo] Check if we have won: ' + wonGame + ' By passing in: ' + didWin)

		if (eloResult == 0) {
			console.log('[End Of Game Elo] Elo result returned 0, defaulting to 20')
			eloResult = 20
		}

		if (!wonGame) {
			lpResult = -5
			eloResult *= -1
		} else {
			lpResult = 10
		}

		Auth.findUserByUsername(username).then((user) => {
			if (user) {
				console.log('[End Of Game Elo] Updating elo for user : ' + user.username + ' New elo will be ' + (user.elo + eloResult) + " By adding " + eloResult)

				if (lpResult <= 0 && ownsLpShield) {
					console.log('[End Of Game Elo]' + username + ' has lp shield active, setting lp to 0')
					didUseLpShield = true
					lpResult = 0
				}

				if (lpResult > 0) {
					console.log('[End Of Game Elo]' + username + ' Lp is greater than 0 checking for boosts')
					if (ownsLpBoost) {
						console.log('[End Of Game Elo]' + username + ' has lp Boost active, adding 10 lp')
						lpResult += config.lpBoostAmount
					}

					if (ownsWinStreak) {
						console.log('[End Of Game Elo]' + username + ' has win streak active, adding 5 lp')
						lpResult += config.winStreakBonus
					}
				}

				user.elo += eloResult
				user.srd += srd
				user.xp += xp
				user.save()

				league.findOneAndUpdate({ league_id: leagueId }, {}, function (error, result) {
					if (!result) {
						return res.status(400).send('Error')
					}
					else {
						result.players.forEach(player => {
							if (player.username == username) {
								console.log('[End of Game Elo] Updating player on league ' + player.username)
								player.ownsLpShield = ownsLpShield
								player.ownsLpBoost = ownsLpBoost
								player.onWinStreak = ownsWinStreak
								//result.players.set(player, { username : username, isOnWinStreak : ownsWinStreak, ownsLpBoost : ownsLpBoost, ownsLpShield : ownsLpShield })
							}
						});
						console.log('[End of Game Elo] ' + JSON.stringify(result.players))
					}
				})

				return res.status(200).json({
					eloResult: eloResult,
					matchElo: matchElo,
					lpResult: lpResult,
					usedLpShield: didUseLpShield
				})
			}
			else {
				return res.status(400).send('Error finding user')
			}
		})
	}

	this.forefitMatch = function (req, res) {
		const username = req.body.username
		console.log('Forefit Match: ' + username + ' has forefit the match')
        const Srd = Number(req.body.srd)
		Auth.findUserByUsername(username).then((user) => {
			if (!user) {
				console.log('Forefit Match Error: No User found with name: ' + username)
				return res.status(400).send()
			} else {
				console.log('Forefit Match: Taken ' + config.forefitEloLoss + ' from ' + username)
				user.elo -= Srd;
				user.save()
				return res.status(200).send()
			}
		})
	}

	this.giveforefitback = function (req, res) {
		const username = req.body.username
		console.log('Forefit Match: ' + username + ' User has got forefit back')
		const Srd = Number(req.body.srd)
		Auth.findUserByUsername(username).then((user) => {
			if (!user) {
				console.log('giving Forefit back Match Error: No User found with name: ' + username)
				return res.status(400).send()
			} else {
				console.log('Forefit Match given back ' + config.forefitEloLoss + ' from ' + username)
				user.elo += Srd;
				user.save()
				return res.status(200).send()
			}
		})
	}

	this.createQueueDetails = function (userId, gametype) {

	}

	this.refreshExpiry = function (userId, gametype, details) {

	}

	this.doesGametypeExist = function (selectedGameType) {

	}

	this.getGametype = function (selectedGameType) {

	}

	this.leave = function (req, res) {

	}

	this.complete = function (req, res) {

	}

	// CG: ONLY CALLED IN RANKED MATCHES!
	//Send player score at the end of a match
	this.score = function (req, res) {

	}

	this.fakeonlinescore = function (req, res) {

	}


	this.report = function (req, res) {

	}

}

module.exports = exports = Matchmaker;