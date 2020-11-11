var Promise 	= require('bluebird');
var errors		= require('./../messages/errors');
var User 		= require('./../../models/user');

var methods = {
	findUserById : function(id){
		return User.findById( id )
		.select('username _id statistics level experience elo wins matches goals bestHighscore')
		.exec()
		.then( function(user){
			return new Promise(function(resolve, reject){
				if(!user){
					reject(errors.userNotFoundError);
				} else {
					resolve(user);
				}
			});
		} );
	},
	findUserByName : function(id){
		return User.findOne({
			username : id
		}).exec().then(function(user) {
			return new Promise(function(resolve, reject) {
				if (!user) {
					return reject(errors.userNotFoundError);
				}
				resolve(user);
			});
		});
	},	
	updateProfileStatistics : async function(user, stats){
		user.statistics = JSON.stringify(stats);
		return await user.save();
	},
	getMatchesPlayedLast48: function(user_id){
		
	},
	resetMatchesPlayedLast48: function(user_id){
		
	},
};

module.exports = methods 