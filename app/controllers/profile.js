const goosepage = require('goosepage');

goosepage.defaults = {
	//itemsPerPage : 20,
	page : 0
};

const User = require('../models/user');
const methods = require('./methods/profile');
const errors = require('./messages/errors');
const notifications = require('./messages/notifications');
const leaderboard = require('./leaderboard') 
const Auth = require('./methods/auth')
var paths = {
	setStats : function(req, res) {
        console.log("[setStats]"); 
		var stats = req.body.stats || '';
		if (stats === '') {
			return res.status(errors.invalidBody.code).json(errors.invalidBody);
		}

		methods.findUserById(req.decoded._id).then(function(user) {
			return methods.updateProfileStatistics(user, stats)
		}).then(function() {
			return res.status(200).json(notifications.profileUpdated);
		}).caught(function(err) {
			return res.status(err.code).json(err);
		});
	},
	get : async function(req, res) {
        //console.log("[profile:get]"); 
		await methods.findUserById(req.params.id).then(function(user_model) {
			
			if(!user_model){
				return new User();  
			}

			//Find matches last 48 hours
			var user = user_model.toObject();
			return Promise.resolve(user);
			
		}).then(function(user){
			return res.status(200).json(user);
		}).caught(function(err) {
			return res.status(err.code || 500).json(err);
		});
	},
	getByName : async function(req, res) {
        console.log("[profile:getByName]"); 
		await methods.findUserByName(req.params.username).then( async function(user_model) {						
			//Find matches last 48 hours
			var user = user_model.toObject();
			return Promise.resolve(user);
			
		}).then(function(user){
			return res.status(200).json(user);
		}).caught(function(err) {
			console.log('[Get user by name] Error: ' + error)
			return res.status(err.code || 500).json(err);
		});
	},		
	getElo : async function(req, res){
        console.log("[profile:getElo]");
		await User.findById( req.params.id )
		.select('elo')
		.exec()
		.then( function(user){
			return new Promise(function(resolve, reject){
				if(!user){
					reject(errors.userNotFoundError);
				} else {
					resolve(user);
				}
			})
		} ).then(function(user) {
			return res.status(200).json(user);
		}).caught(function(err) {
			return res.status(err.code).json(err);
		});
	},

	leaderboard : async function(req, res) {
		console.log('Leaderboard :: Returning all leaderboard users')
		try {
			console.log('Leaderboard :: returning: ' + JSON.stringify(leaderboard.leaderboard))
			return res.status(200).json(leaderboard.leaderboard)
		} catch (e) {
			return res.status(e.code).json({Error : e})
		}
	},

	leaderboardPage : function(req, res) {
        console.log("[profile:leaderboardPage]");
		goosepage(User.find().sort({
			'elo' : -1
		}).select('id username elo'), {
			page : req.params.page
		}).then(function(result) {
			return res.json(result);
		});
	},

	getCarLevel : function(req, res) 
	{
		try
		{
			let username = req.body.username; 
			let name = req.body.carName; 
			let OverrideCarLevel = req.body.OverrideCarLevel;
            OverrideCarLevel = Number(OverrideCarLevel);
			Auth.findUserByUsername(username).then((user) => {
				if(!user)
				{
					console.log("username not found for car")
					return res.status(500).send('User not found')
				}
				let foundCar = false
				let level = 0;
				let cars = user.carLevels				
				cars.forEach(carLevel => {
					if(carLevel.carName == name) 
					{
						foundCar = true
						level = carLevel.level
						console.log("CAR FOUND  " + name + level)
					}
				});
				if(!foundCar)
				{
					if(!cars.includes(name))
					{
						cars.push({carName : name, level : OverrideCarLevel})
						console.log("CAR NOT FOUND  " + name)
					}
					
				}
				user.carLevels = cars
				user.save()
				console.log("GETTING LEVEL" + level)
				return res.status(200).send({"carLevel" : level})
			})
		}
		catch(e)
		{
			console.log("Caught error ---" + e)
			return res.status(500).send()
		}
	},

	setCarLevel : function(req, res) {
		const username = req.body.username; 
		const carName = req.body.carName; 

		Auth.findUserByUsername(username).then((user) => {
			
			if(!user) {
				return res.status(500).send('User not found')
			}
			let cars = user.carLevels
			
			cars.forEach(carLevel => {
				if(carLevel.carName == carName) {
					carLevel.level++
				}
			});
            user.save()
			return res.status(200).send()
		})
	},
	resetCalLevels : function(req, res) {
		const username = req.body.username; 
		const carName = req.body.carName; 
		let OverrideCarLevel = req.body.OverrideCarLevel;
        OverrideCarLevel = Number(OverrideCarLevel);

		Auth.findUserByUsername(username).then((user) => {
			
			if(!user) {
				return res.status(500).send('User not found')
			}
			let cars = user.carLevels
			
			cars.forEach(carLevel => {
				if(carLevel.carName == carName) {
					carLevel.level = OverrideCarLevel
				}
			});
            user.save()
			return res.status(200).send()
		})
	}
};

module.exports = paths;