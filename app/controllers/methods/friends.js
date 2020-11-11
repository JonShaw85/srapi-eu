var Promise = require('bluebird');
var _ = require('lodash');
var User = require('./../../models/user');
var errors = require('./../messages/errors');

var methods = {
	validateFriendRequest : function(req) {
        console.log("[validateFriendRequest]");
		return new Promise(function(resolve, reject) {
			if (req.params.id === req.decoded._id) {
				reject(errors.lonely);
			} else {
				resolve(req.params.id);
			}
		});
	},
	sendFriendRequest : async function(friend, username) {
         console.log("[sendFriendRequest]:" + username);
		// Check if we are already friends.
		for (var i = 0; i < friend.social.friends.length; i++) {
			var result = friend.social.friends[i];
			if (result.name == username) {
				return Promise.reject(errors.alreadyFriends);
			}
		}

		// If not
		friend.social.friendRequests.addToSet(username);
		return await friend.save();
	},	
	addBlockedFriend : async function(user, username) {
        console.log("[addBlockedFriend]:" + username);
		user.social.friendsBlocked.addToSet(username);
		return await user.save();
	},		
	removeBlocked : async function(user, username) {
        console.log("[removeBlocked]:" + username);
		user.social.friendsBlocked.pull(username);
		return await user.save();
	},	
	declineRequest : async function(user, username) {
        console.log("[declineRequest]:" + username);
		user.social.friendRequests.pull(username);
		return await user.save();
	},
	getUserById : function(id) {
        //console.log("[friends:getUserById]");
		return User.findById(id).exec().then(function(user) {
			return new Promise(function(resolve, reject) {
				if (!user) {
					return reject(errors.userNotFoundError);
				}

				resolve(user);
			});
		});
	},
	getUserByName : function(id) {
        console.log("[friends:getUserByName]");
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
	getFriend : function(user, username) {
        console.log("[friends:getFriend]" + username);
		return new Promise(function(resolve, reject) {

			methods.getUserByName(username).then(function(friend) {
				resolve([ user, friend ]);
			}, function(error) {
				if (error === errors.userNotFoundError) {
					error = errors.friendNotFoundError;
				}

				return reject(error);
			});
		});
	},
	getFriends : function(user) {
        console.log("[friends:getFriends]");
		return user.social.friends;
	},
	getFriendRequests : function(user) {
        console.log("[friends:getFriendRequests]");
		return User.find({
			'username' : {
				$in : user.social.friendRequests
			}
		}).exec();
	},
	// anti-pattern?
	checkFriendRequest : function(user, username) {
        console.log("[friends:checkFriendRequest]:"+username);
		return new Promise(function(resolve, reject) {
			if (methods.haveFriendRequestFrom(user, username)) {
				resolve([ user, username ]);
			} else {
				reject(errors.friendRequestNotFoundError);
			}
		});
	},
	checkBlockedEntry : function(user, username) {
        console.log("[friends:checkBlockedEntry]:"+username);
		return new Promise(function(resolve, reject) {
			if (methods.isUserBlocked(user, username)) {
				resolve([ user, username ]);
			} else {
				reject(errors.userBlockedNotFoundError);
			}
		});
	},	
	isUserBlocked : function(user, username) {
        console.log("[friends:isUserBlocked]:"+username);
		return _.some(user.social.friendsBlocked, function(friend) {
			return friend === username;
		});
	},	
	haveFriendRequestFrom : function(user, username) {
        console.log("[friends:haveFriendRequestFrom]:"+username);
		return _.some(user.social.friendRequests, function(friend) {
			return friend === username;
		});
	},
	friendRequestError : function(err) {
		return Promise.reject(err);
	},
	makeFriendship : async function(user, friend) {
         console.log("[friends:makeFriendship]:"+friend.username);
		return new Promise(function(resolve, reject) {
			// Pull the request from the friendRequests array
			user.social.friendRequests.pull(friend.username);
			// Add the friend
			user.social.friends.addToSet({
				user_id : friend.id,
				name : friend.username
			});
			// Add the user to the friends list as well
			friend.social.friends.addToSet({
				user_id : user.id,
				name : user.username
			});
			resolve([user.save(), friend.save() ]);
		}).spread(function(user, friend) {
			// Return the new friendship
			var friendship = {
				user : user,
				friend : friend
			};

			return friendship;
		});
	},
	deleteFriendFromList : async function(userArray) {
        try{
			console.log("[friends:deleteFriendFromList]");
		var user = userArray[0];
		var friend = userArray[1];


		if (!_.some(user.social.friends, {
			name : friend.username
		})) {
			console.log('[Remove freiend] friend not found')
			return Promise.reject(errors.friendNotFoundError);
		}

		// Remove friend from user's friend list
		user.social.friends.remove(_.find(user.social.friends, {
			name : friend.username
		}));

		return await user.save().then(function() {
			// reverse the array and send it back
			return Promise.resolve([ friend, user ]);
		})
		} catch(e){
			console.log('[Remove Friend] Error : ' + e)
		}
	}
};

module.exports = methods;