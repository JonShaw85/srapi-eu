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
        //console.log("[profile:get................]"); 
		await methods.findUserById(req.params.id).then(function(user_model) {
			
			if(!user_model){
				console.log('FAILED............')
				return new User();  				
			}

			//Find matches last 48 hours
			var user = user_model.toObject();
			console.log('PROFILE GET......'+ JSON.stringify(user))
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
	}
};

module.exports = paths;