var Promise = require('bluebird');
var methods = require('./methods/auth');
var errors = require('./messages/errors');
var notifications = require('./messages/notifications');
var supportedPlatforms = [ 'Android', 'iOS', 'Debug' ];
var Config = require('../../config');
const { json } = require('body-parser');

var auth = {
	
	gameVersion : function(req, res) {
		return res.status(200).send('Server says hello')
	},

	register : function(req, res) {
		var platform = req.body.platform || '';
		var payload = req.body.payload || '';
		var username = req.body.username || '';
        
		if (platform === '' || payload === '' || username === '') {
			return res.status(errors.invalidBody.code).json(errors.invalidBody);
		}

		// Determine which useragent we are using
		var platformAuth = getAuthFor(res, platform, payload);
		if (platformAuth === undefined)
			return res.status(400).json(errors.invalidPayloadError)
			// Check rif user is valid and/or doesnt exist
		
		//TODO create a better username check to disallow code injection
		//this is mostly blocked by platform auth though but wont stop crafty hackers
		var userCheck = methods.checkForExistingUsers;
		//var userCheck = methods.validateUsername(username).then(methods.checkForExistingUsers);
		
		// execute promise chain
		//console.log("payload: " + payload);
		Promise.join(platformAuth(payload), userCheck, function(id) {
			//console.log("id: " + id);
			return methods.createNewUser(username, id, platform);
		}).then(function(user) {
			return res.status(200).json(notifications.accountCreated);
		}).caught(function(error) {
			//console.log("error: " + error);			
			return res.status(error.code >= 100 && error.code < 600 ? err.code : 500).json(error);
		});
        
	},
    registerguest : function(req, res) {
		var platform = req.body.platform || '';
		var payload = req.body.payload || '';
		var username = req.body.username || '';

		if (platform === '' || payload === '' || username === '') {
			return res.status(errors.invalidBody.code).json(errors.invalidBody);
		}
        
		// Determine which useragent we are using
		var platformAuth = getAuthFor(res, platform, payload);
		if (platformAuth === undefined)
			return res.status(400).json(errors.invalidPayloadError)
			// Check if user is valid and/or doesnt exist
		
		var duplicateUserCheck = methods.checkForDuplicateUserNames;
        
		// execute promise chain
		Promise.join(platformAuth(payload), duplicateUserCheck(username), function(id) {
            var password = methods.generatePassword();
			return methods.createNewGuestUser(username, password, platform);
		}).then(function(user) {
            console.log("success returning notification!");
            const notification = notifications.accountCreated;
            notification.user  = user;
            notification.version = Config.version;    
			return res.status(200).json(notification);
		}).caught(function(error) {
			console.log("error: " + error);			
			return res.status(error.code >= 100 && error.code < 600 ? error.code : 500).json(error);
		});
		//return res.end(); 
	},
    registerlavaskull : function(req, res) {
        
		var platform        = req.body.platform || '';
		var payload         = req.body.payload || '';
		var username        = req.body.username || '';
        var password        = req.body.password || '';
        var email           = req.body.email || '';
        var existingUser    = req.body.existing_user || '';
        
        var guestUserName    = req.body.guest_username || '';
        var guestPassword    = req.body.guest_password || '';
        
		if (platform === '' || payload === '' || username === '' || password === '' || email === '' || existingUser === '' ) {
			return res.status(errors.invalidBody.code).json(errors.invalidBody);
		}
        
        if(existingUser === 'True')
        {
            if (guestUserName === '' || guestPassword === '' ) 
            {
                return res.status(errors.invalidBody.code).json(errors.invalidBody);
		    }
        }
        
		// Determine which useragent we are using
		var platformAuth = getAuthFor(res, platform, payload);
		if (platformAuth === undefined)
			return res.status(400).json(errors.invalidPayloadError)
		
        var emailCheck = methods.checkForDuplicateEmail(email);
        
        //console.log("[registerlavaskull] existingUser: " + existingUser);
        
        if(existingUser === 'False')
        {
            //console.log("[registerlavaskull] - existingUser:false - checkForDuplicateUserNames");
            
            var duplicateUserCheck = methods.checkForDuplicateUserNames(username);
            
            // execute promise chain
            Promise.join(platformAuth(payload), emailCheck, duplicateUserCheck, function(id) {
                 return methods.createNewLavaSkullUser(username, password, email, platform);
            }).then(function(user) {
                return methods.sendVerificationEmail(user,req);
            }).then(function(newUser) {       
                return res.status(200).json(notifications.accountCreated);
            }).caught(function(error) {
                console.log("error: " + error);			
                return res.status(error.code >= 100 && error.code < 600 ? error.code : 500).json(error);
            });
        }
        else
        {
            //console.log("[registerlavaskull] - existingUser:true - canReplaceGuestUser");
            
            var canReplaceUser = methods.canReplaceGuestUser(username,guestUserName);
            
            // execute promise chain
            Promise.join(platformAuth(payload), emailCheck, canReplaceUser, function(id) {
                return methods.replaceGuestUser(username,password,email,guestUserName); 
             }).then(function(replacedUser) {
                return methods.findUserByUsername(username, platform);
             }).then(function(user) {
                return methods.sendVerificationEmail(user,req);
             }).then(function(userInDatabase) {
                return res.status(200).json(notifications.accountCreated);
             }).caught(function(error) {
                console.log("error: " + error);			
                return res.status(error.code >= 100 && error.code < 600 ? error.code : 500).json(error);
            });
		}
		return; 
	},
	login : function(req, res) {
		const platform = req.body.platform || ''
		const payload  = req.body.payload  || ''
		const username = req.body.username || ''
		const version = req.body.version || '';

		const doLogin = () => {
			const platformAuth = getAuthFor(res, platform, payload);
			let   userId		   = '';

			if (platformAuth === undefined) return res.status(400).json(errors.invalidPayloadError);
			
			if(version != undefined && version != '' && version != Config.version)
				return res.status(401).json(errors.invalidVersion);

			const assignUserId = (id, user) => {
				return methods.comparePassword(user, payload.password);
			}

			const sendResponse = (user, token) => {
				const notification = notifications.loggedin;

				notification.user  = user;
				notification.token = token;
				notification.version = Config.version;

				return res.status(200).json(notification);
			}

			const handleError = (error) => {
				return res.status(error.code || 500).json(error);
			}

			const doPlatformAuth = platformAuth(payload);
			const doFindUser     = methods.findUserByUsername(username);

			Promise
				.join(doPlatformAuth, doFindUser, assignUserId)
				.spread(sendResponse)
				.caught(handleError);
		}

		if (platform === '' || payload === '' || username === '') {
			return res.status(errors.invalidBody.code).json(errors.invalidBody);
		} else {
			doLogin();
		}
	},
    loginguest : function(req, res) {
			const platform = req.body.platform || ''
		const payload  = req.body.payload  || ''
		const username = req.body.username || ''
		const version = req.body.version || '';

		const doLogin = () => {
			const platformAuth = getAuthFor(res, platform, payload);
			let   userId		   = '';

			if (platformAuth === undefined) 
                return res.status(400).json(errors.invalidPayloadError);
			
			if(version != undefined && version != '' && version != Config.version)
				return res.status(401).json(errors.invalidVersion);

			const assignUserId = (id, user) => {
				return methods.compareGuestPassword(user, payload.password);
			}

			const sendResponse = (user, token) => {
				const notification = notifications.loggedin;

				notification.user  = user;
				notification.token = token;
				notification.version = Config.version;
                notification.gameversion = Config.gameVersion;
                notification.gameversion_android = Config.gameVersion_android;
                notification.gameversion_ios = Config.gameVersion_ios;
                
                notification.dailyrewardcar = Config.dailyrewardcar;

				return res.status(200).json(notification);
			}

			const handleError = (error) => {
                console.log("[handleError] error: " + error);
				return res.status(error.code || 500).json(error);
			}

			const doPlatformAuth = platformAuth(payload);
			const doFindUser     = methods.findUserByUsername(username);

			Promise
				.join(doPlatformAuth, doFindUser, assignUserId)
				.spread(sendResponse)
				.caught(handleError);
		}

		if (platform === '' || payload === '' || username === '') {
			return res.status(errors.invalidBody.code).json(errors.invalidBody);
		} else {
			doLogin();
		}
	},
    signinlavaskull : function(req, res) {
        
        const platform = req.body.platform || ''
		const payload  = req.body.payload  || ''
		const username = req.body.username || ''
		const version  = req.body.version   || '';
        
		const doLogin = () => {
			const platformAuth = getAuthFor(res, platform, payload);
			let   userId		   = '';

			if (platformAuth === undefined) return res.status(400).json(errors.invalidPayloadError);
			
			if(version != undefined && version != '' && version != Config.version)
				return res.status(401).json(errors.invalidVersion);

			const assignUserId = (id, user) => {
                
                    userId = user.id;
                    return methods.compareLavaSkullPassword(user, payload.password);
			}

			const sendResponse = (user, token) => {
				const notification = notifications.loggedin;

				notification.user  = user;
				notification.token = token;
				notification.version = Config.version;
                notification.gameversion = Config.gameVersion;
                notification.gameversion_android = Config.gameVersion_android;
                notification.gameversion_ios = Config.gameVersion_ios;
                
                notification.dailyrewardcar = Config.dailyrewardcar;
                
				return res.status(200).json(notification);
			}

			const handleError = (error) => {
                console.log("[handleError] error: " + error);
				return res.status(error.code || 500).json(error);
			}

			const doPlatformAuth = platformAuth(payload);
			const doFindUser     = methods.findUserByUsername(username);

			Promise
				.join(doPlatformAuth, doFindUser, assignUserId)
				.spread(sendResponse)
				.caught(handleError);
            
		}

		if (platform === '' || payload === '' || username === '') {
			return res.status(errors.invalidBody.code).json(errors.invalidBody);
		} else {
			doLogin();
		}
	},
    signinlavaskullemail : function(req, res) {
        
        const platform = req.body.platform || ''
		const payload  = req.body.payload  || ''
		const email    = req.body.email || ''
		const version  = req.body.version   || '';
        
        //console.log("signinlavaskullemail");
        
		const doLogin = () => {
			const platformAuth = getAuthFor(res, platform, payload);
			let   userId		   = '';

			if (platformAuth === undefined) return res.status(400).json(errors.invalidPayloadError);
			
			if(version != undefined && version != '' && version != Config.version)
				return res.status(401).json(errors.invalidVersion);

			const assignUserId = (id, user) => {
                    //console.log("signinlavaskullemail - assignUserId");
                    userId = user.id;
                    return methods.compareLavaSkullPassword(user, payload.password);
			}

			const sendResponse = (user, token) => {
				const notification = notifications.loggedin;

                //console.log("signinlavaskullemail - sendResponse");
                
				notification.user  = user;
				notification.token = token;
				notification.version = Config.version;
                notification.gameversion = Config.gameVersion;
                notification.gameversion_android = Config.gameVersion_android;
                notification.gameversion_ios = Config.gameVersion_ios;
                
				return res.status(200).json(notification);
			}

			const handleError = (error) => {
                //console.log("[handleError] error: " + error);
				return res.status(error.code || 500).json(error);
			}

			const doPlatformAuth = platformAuth(payload);
			const doFindUser     = methods.findUserByEmail(email, platform);

			Promise
				.join(doPlatformAuth, doFindUser, assignUserId)
				.spread(sendResponse)
				.caught(handleError);
            
		}

		if (platform === '' || payload === '' || email === '') {
			return res.status(errors.invalidBody.code).json(errors.invalidBody);
		} else {
			doLogin();
		}
	},	
    renameuser : function(req, res)
    {
        const platform      = req.body.platform || ''
		const payload       = req.body.payload  || ''
		const username      = req.body.username || ''
		const version       = req.body.version  || '';
        const new_username  = req.body.new_username  || '';
        
		var platformAuth = getAuthFor(res, platform, payload);
		if (platformAuth === undefined)
			return res.status(400).json(errors.invalidPayloadError)
		 
        var renameFunc = methods.renameUser;
            
        // execute promise chain
        Promise.join(platformAuth(payload), renameFunc(username,payload.password,new_username), function(id) {
             return methods.findUserByUsername(new_username);
        }).then(function(user) {
            //console.log("sending back user: " + user);
            const notification = notifications.userRenamed;
            notification.user  = user;
            notification.version = Config.version;    
			return res.status(200).json(notification);
        }).caught(function(error) {
            console.log("error: " + error);			
            return res.status(error.code >= 100 && error.code < 600 ? error.code : 500).json(error);
        });
    },
    resendverify : function(req, res)
    {
        const platform      = req.body.platform || ''
		const payload       = req.body.payload  || ''
		const username      = req.body.username || ''
		const version       = req.body.version  || '';
        const new_email     = req.body.new_email  || '';
        
		var platformAuth = getAuthFor(res, platform, payload);
		if (platformAuth === undefined)
			return res.status(400).json(errors.invalidPayloadError)
		 
        var resendFunc = methods.resendVerify;
            
        // execute promise chain
        Promise.join(platformAuth(payload), resendFunc(username,payload.password,new_email), function(id, user) {
            return methods.sendVerificationEmail(user,req);
        }).then(function(user) {
            //console.log("sending back user: " + user);
            const notification = notifications.verificationResent;
            notification.user  = user;
            notification.version = Config.version;    
			return res.status(200).json(notification);
        }).caught(function(error) {
            console.log("error: " + error);			
            return res.status(error.code >= 100 && error.code < 600 ? error.code : 500).json(error);
        });
    },
    validateToken : function(req, res)
    {
        const platform      = req.body.platform || ''
		const payload       = req.body.payload  || ''
		const username      = req.body.username || ''
        const token         = req.body.token    || ''
        let   userId		= '';
          
        //console.log("req: " + req);
        //console.log("res: " + res);
        //console.log("platform: " + platform);
        //console.log("payload: " + payload);
        //console.log("username: " + username);
        //console.log("token: " + token);
        
        const doPlatformAuth = getAuthFor(res, platform, payload);
        const doFindUser     = methods.findUserByUsername(username);
        
        //console.log("starting promise..");
        
        Promise.join(doPlatformAuth, doFindUser, function(id, user) {
			return new Promise(function(resolve, reject) { 
                return resolve(user);
			 });
		}).then(function(user) {   
            const notification = notifications.validToken;
            notification.user  = user;
            notification.token = token;
            notification.version = Config.version;
			return res.status(200).json(notification);
		}).caught(function(error) {
            console.log("error: " + error);	
			return res.status(error.code).json(error);
		});
        
    },
    forgotpassword : function(req, res) {
             
        const platform      = req.body.platform || ''
		const payload       = req.body.payload  || ''
		const email         = req.body.email || ''
        
        const doPlatformAuth = getAuthFor(res, platform, payload);
        const doFindUser     = methods.findUserByEmail(email, platform);
        
        Promise.join(doPlatformAuth, doFindUser, function(id, user) {
			return methods.forgotpassword(user);
		}).then(function() {   
			return res.status(200).json(notifications.forgotpassword);
		}).caught(function(error) {
            console.log("error: " + error);	
			return res.status(error.code).json(error);
		});
    },
    forgotUserName : function(req, res) {
             
        const platform      = req.body.platform || ''
		const payload       = req.body.payload  || ''
		const email         = req.body.email || ''
        
        //console.log("forgotUserName: " + email);	
        
        const doPlatformAuth = getAuthFor(res, platform, payload);
        const doFindUser     = methods.findUserByEmail(email, platform);
        
        Promise.join(doPlatformAuth, doFindUser, function(id, user) {
			return methods.forgotUserName(user);
		}).then(function() {   
			return res.status(200).json(notifications.forgotUserName);
		}).caught(function(error) {
            console.log("error: " + error);	
			return res.status(error.code).json(error);
		});
    },
	logout : function(req, res, next) {
        //console.log("logout: 'session' " + req.decoded._id)

	},
	token : function(req, res, next) {
		methods.validateFields(req).then(function(token) {
			return methods.decodeToken(req, token);
		}).nodeify(next).caught(function(error) {
			console.log('Token Error: ' + error.code + ' : ' + JSON.stringify(error))
			return res.status(error.code).json(error);
		});
	},
	connectGoogle : function(req, res) {
		var token = req.body.token || '';
		if (token === '') {
			return res.status(errors.invalidBody.code).json(errors.invalidBody);
		}

		var googleAuth = methods.googleAuth(token);
		var findUser = methods.findUserById(req.decoded._id);

		Promise.join(googleAuth, findUser, function(response, user) {
			return methods.connectGoogle(response, user);
		}).then(function() {
			return res.status(200).json(notifications.socialNetworkConnected);
		}).caught(function(e) {
			return res.status(error.code).json(error);
		});
	},
	connectFacebook : function(req, res) {
		var token = req.body.token || '';
		if (token === '') {
			return res.status(errors.invalidBody.code).json(errors.invalidBody);
		}

		var facebookAuth = methods.facebookAuth(token);
		var findUser = methods.findUserById(req.decoded._id);

		Promise.join(facebookAuth, findUser, function(response, user) {
			return methods.connectFacebook(response, user);
		}).then(function() {
			return res.status(200).json(notifications.socialNetworkConnected);
		}).caught(function(e) {
			return res.status(error.code).json(error);
		});
	},
	getVersion: function(req, res){
		return res.status(200).json({version: Config.version});
	},
};

function getAuthFor(res, platform, payload) {
	if (!supportedPlatforms.some(function(v) {
		return platform.indexOf(v) >= 0;
	})) {
		console.log('Platform specified is not supported')
		return res.status(errors.platformNotSupported.code).json(
				errors.platformNotSupported);
	}

    return isValidDebugPayload(payload) ? methods.debugAuth : undefined
    /*
	switch (platform) {
	case 'Android':
		return isValidAndroidPayload(payload) ? methods.androidAuth : undefined
		break;
	case 'iOS':
		return isValidiOSPayload(payload) ? methods.iosAuth : undefined
		break;
	case 'Debug':
		return isValidDebugPayload(payload) ? methods.debugAuth : undefined
		break;
	}*/
}

function isValidAndroidPayload(payload) {
	return payload.hasOwnProperty('bundleId')
            && payload.hasOwnProperty('device_id')
            // payload.hasOwnProperty('id_token')
			// && payload.hasOwnProperty('device_id')
}

function isValidiOSPayload(payload) {
	return payload.hasOwnProperty('bundleId')
        && payload.hasOwnProperty('device_id')
            // payload.hasOwnProperty('salt')
			// && payload.hasOwnProperty('timestamp')
			// && payload.hasOwnProperty('publicKeyUrl')
			// && payload.hasOwnProperty('playerId')
			// && payload.hasOwnProperty('bundleId')
			// && payload.hasOwnProperty('signature')
			// && payload.hasOwnProperty('device_id')
}

function isValidDebugPayload(payload) {
	return payload.hasOwnProperty('device_id')
			// && payload.hasOwnProperty('device_id')
}

module.exports = auth;