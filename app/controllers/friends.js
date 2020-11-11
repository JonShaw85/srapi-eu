var Promise = require('bluebird');
var User = require('../models/user');
var methods = require('./methods/friends');
var notifications = require('./messages/notifications');

var friends = {
	allfriends : function(req, res) {
		methods.getUserById(req.decoded._id).then(methods.getFriends).then(
				function(friends) {
					var notification = notifications.allFriends;
					notification.friends = friends;

					return res.status(200).json(notification);
				}).caught(function(err) {
			return res.status(err.code).json(err);
		});
	},
	findfriends : async function(req, res) {
		var query = req.params.id || ''
		// SLOPPY!
		if (query === '') {
			return res.status(400).json({
				succes : false,
				code : 400,
				message : 'missing query.'
			})
		}
		await User.aggregate([ {
			'$match' : {
				'username' : {
					'$regex' : query,
					'$options' : 'i'
				}
			}
		}, {
			'$unwind' : '$username'
		}, {
			'$match' : {
				'username' : {
					'$regex' : query,
					'$options' : 'i'
				}
			}
		}, {
			'$group' : {
				'_id' : '$_id',
				'username' : {'$first': '$username'}
			}
		}, {
			'$limit' : 10

		}]).then(function(results) {
			return res.status(200).json(results)
		}).catch(function(err) {
			return res.status(err.code).json(err);
		})

	},	
	getUsersblockingYou : async function (req, res)
	{
		var name = req.params.username;

		await User.aggregate([ {
			'$match' : {
				'social.friendsBlocked' : {
					'$regex' : name					
				}
			}
		}, {
			'$unwind' : '$username'
		}, {
			'$match' : {
				'social.friendsBlocked' : {
					'$regex' : name					
				}
			}
		}, {
			'$group' : {
				'_id' : '$_id',
				'username' : {'$first': '$username'}
			}
		} ]).then(function(results) {
             return res.status(200).json(results)
		}).catch(function(err) {
			return res.status(err.code).json(err);
		})
	},	

	findnotblockedfriends : async function(req, res) {
		var query = req.params.id || ''
		var blist = req.params.list || ''

		// SLOPPY!
		if (query === '') {
			return res.status(400).json({
				succes : false,
				code : 400,
				message : 'missing query.'
			})
		}

		var arr = blist.split(",");				

		await User.aggregate([ {
			'$match' : {
				'username' : {
					'$regex' : query,
					'$options' : 'i',
					'$nin' : arr
				}
			}
		}, {
			'$unwind' : '$username'
		}, {
			'$match' : {
				'username' : {
					'$regex' : query,
					'$options' : 'i',
					'$nin' : arr
				}
			}
		}, {
			'$group' : {
				'_id' : '$_id',
				'username' : {'$first': '$username'}
			}
		} ]).then(function(results) {
			return res.status(200).json(results)
		}).catch(function(err) {
			return res.status(err.code).json(err);
		})
	},		
	
	allblockedfriends : async function(req, res) {
		
		await methods.getUserById(req.decoded._id).then(function(user) {
			var notification = notifications.allBlockedFriends;
			notification.blocked = user.social.friendsBlocked;
			return res.status(200).json(notification);
		}).caught(function(err) {
			return res.status(err.code).json(err);
		});
	},	
	allfriendrequests : async function(req, res) {
		//return res.status(200).send('You got no fans')
		await methods.getUserById(req.decoded._id).then(function(user) {
			var notification = notifications.allFriendRequests;
			notification.requests = user.social.friendRequests;
			console.log('Friends Requests: ' + JSON.stringify(notification))
			return res.status(200).json(notification);
		}).caught(function(err) {
			return res.status(err.code).json(err);
		});
	},
    allfriendrequests1 : async function(req, res) {
		
		await methods.getUserById(req.decoded._id).then(function(user) {
			var notification = notifications.allFriendRequests;
			notification.requests = user.social.friendRequests;
			console.log('Friends Requests: ' + JSON.stringify(notification))
			return res.status(200).json(notification);
		}).caught(function(err) {
			return res.status(err.code).json(err);
		});
	},
    allfriendrequests2 : async function(req, res) {
		
		await methods.getUserById(req.decoded._id).then(function(user) {
			var notification = notifications.allFriendRequests;
			notification.requests = user.social.friendRequests;
			console.log('Friends Requests: ' + JSON.stringify(notification))
			return res.status(200).json(notification);
		}).caught(function(err) {
			return res.status(err.code).json(err);
		});
	},
	pendingfriendrequests : function(req, res) 
	{						
		User.find({ "social.friendRequests" : req.decoded._user.username } ).then(function(results) {
			return res.status(200).json(results)
		}).caught(function(err) {
			return res.status(err.code).json(err);
		})
	},			

	blockfriend : function(req, res) {
		//req.params.id -> username to block
		//req.decoded._user.username -> our name
		methods.getUserByName(req.decoded._user.username).then(
				function(user) {
					return methods.addBlockedFriend(user,
						req.params.id);
				}).then(function() {
			return res.status(200).json({success: true, username: req.params.id} )
		}).caught(function(err) {
			return res.status(err.code).json(err);
		});
	},

	requestfriend : function(req, res) {
		methods.validateFriendRequest(req).then(methods.getUserByName).then(
				function(user) {
					return methods.sendFriendRequest(user,
							req.decoded._user.username);
				}).then(function() {
			return res.status(200).json({success: true, username: req.params.id} )
		}).caught(function(err) {
			return res.status(err.code).json(err);
		});
	},	

	removeBlocked : function(req, res) {
		methods.getUserById(req.decoded._id).then(function(user) {
			return methods.checkBlockedEntry(user, req.params.id);
		}).spread(methods.removeBlocked).then(
				function() {
					return res.status(200).json(
							notifications.userUnblockedSuccessfully)
				}).caught(function(err) {
			return res.status(err.code).json(err);
		});
	},
	declinefriend : function(req, res) {
		methods.getUserById(req.decoded._id).then(function(user) {
			return methods.checkFriendRequest(user, req.params.id);
		}).spread(methods.declineRequest).then(
				function() {
					return res.status(200).json(
							notifications.requestRemovedSuccessfully)
				}).caught(function(err) {
			return res.status(err.code).json(err);
		});
	},
	cancelRequest : function(req, res) {				

		methods.getUserById(req.params.id).then(function(user) {
			return methods.checkFriendRequest(user, req.decoded._user.username);
		}).spread(methods.declineRequest).then(
				function() {
					return res.status(200).json(
							notifications.requestRemovedSuccessfully)
				}).caught(function(err) {
			return res.status(err.code).json(err);
		});
	},	
	acceptfriend : function(req, res) {
		var username = req.params.id;
		methods.getUserById(req.decoded._id).then(function(user) {
			return methods.checkFriendRequest(user, username);
		}).spread(methods.getFriend).spread(methods.makeFriendship).then(
				function(friendship) {
					return res.status(200).json({friendId : friendship.friend.id})
				}).caught(function(err) {
			return res.status(err.code).json(err);
		});
	},
	removefriend : function(req, res) {
		var user = methods.getUserByName(req.decoded._user.username);
		var friend = methods.getUserByName(req.params.id);

		Promise.all([ user, friend ]).then(methods.deleteFriendFromList).then(
				methods.deleteFriendFromList).then(
				function() {
					return res.status(200).json(notifications.friendRemovedSuccessfully);
				}).caught(function(err) {
			return res.status(500).json(err);
		});
	}
};

module.exports = friends;