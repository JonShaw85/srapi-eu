var Promise = require('bluebird');
var validator = require('validator');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var request = Promise.promisify(require("request"));
var strongPaswordGenerator = require("strong-password-generator");
var nodemailer = require('nodemailer');

Promise.promisifyAll(request, {
	multiArgs : true
});

const errors = require('./../messages/errors')
const User = require('./../../models/user')

var defaultPasswordConfig = {
    base: 'WORD',
  length: {
    min: 12,
    max: 16
  },
  capsLetters: {
    min: 3,
    max: 3
  },
  numerals: {
    min: 2,
    max: 2
  },
  spacialCharactors: {
    includes: [],
    min: 0,
    max: 0
  },
  spaces: {
    allow: false,
    min: 0,
    max: 0
  }
}

var mailertransport = nodemailer.createTransport({
    debug: true,
    host: 'smtp.dreamhost.com', // hostname
    secure: true,
    port: 465, // port for secure SMTP
    auth: {
        user: "passwords@lavaskull.com",
        pass: "ChrisLAVASKULL"
    }
});

var methods = {

    sendVerificationEmail : (user, req) => {
        return new Promise((resolve, reject) => {
            var host=req.get('host');
            const url = "http://"+req.get('host')+"/confirmation?id="+user._id;
            console.log("[sendVerificationEmail]: link: " + url);
            //const url = "http://srapi.herokuapp.com/api/v1/confirmation/?id=" + user._id;
            var emailtext = '<body> Hello 999,<br /> Please click this link to confirm your email address: <a href="' + url + '" >Link</a> <br /> Thanks<br /> LAVASKULL</body>'
            emailtext = emailtext.replace("999", user.username);    
              
            const mailOptions = {
          from: 'passwords@lavaskull.com', // sender address
          to: user.email, // list of receivers
          subject: 'Lava Skull: Confirm Email', // Subject line
          html: emailtext
            };
        
        mailertransport.sendMail(mailOptions, (err, info) => {
           if(err)
             console.log(err)
           else
             console.log(info);
        });
        
            return resolve(user);
        });
    },

    validateEmail : (email) => {
        return new Promise((resolve, reject) => {
			// Validate email
			if (!validator.isEmail(email)) {
				reject(errors.invalidEmailError);
			} else {
				resolve();
			}
		});
    },

    validateUsername : (username) => {
        return new Promise((resolve, reject) => {
			// validate username
			if (!validator.isAlphanumeric(username)) {
				reject(errors.invalidUsername);
			} else {
				resolve(username);
			}
		});
    },

    validatePassword : (password) => {
		return new Promise((resolve, reject) => {
			// validate password length
			if (password.length < 8) {
				reject(errors.invalidPasswordLength);
			} else {
				resolve();
			}
		});
    },
    
    checkForExistingUsers : (username, platform) => {
		// Check for existing users
		var platformId = (platform === 'Android') ? 2 : (platform === 'iOS') ? 1 : 0;
        return User.findOne({
			$or : [ {
				username : username,
				platform : platformId
			} ]
		}).exec().then((users) => {
			return new Promise((resolve, reject) => {
				if (users) {
					if (_.find(users, {
						username : username,
						platform, platformId
					})) {
						reject(errors.usernameAlreadyInUse)
					}
				}

				resolve();
			});
		});
    },
    
    checkForDuplicateUserNames : (username) => {
        return User.findOne({ username: username }).exec().then((user) => {
            return new Promise((resolve, reject) => {            
                if(user)
                {
                    console.log("[checkForDuplicateUserNames]: username is already taken!");
                    return reject(errors.usernameAlreadyInUse);
                }
                return resolve();
			 });
		});
    },
    
    checkForDuplicateEmail : (email) => {
        return User.findOne({ email: email }).exec().then((user) => {
            return new Promise((resolve, reject) => {            
                if(user)
                {
                    console.log("[checkForDuplicateEmail]: email is already taken!");
                    return reject(errors.emailAlreadyInUse);
                }
                return resolve();
			 });
		});
    },
    
    forgotpassword : (user) => {
        
        return new Promise((resolve, reject) => {
            var emailtext = "<body> Hello 999,<br /> Your password is 777.<br /> Thanks<br /> LAVASKULL</body>"
            emailtext = emailtext.replace("999", user.username);    
            emailtext = emailtext.replace("777", user.password); 
            
            const mailOptions = {
          from: 'passwords@lavaskull.com', // sender address
          to: user.email, // list of receivers
          subject: 'Forgot Password', // Subject line
          html: emailtext// plain text body
            };
        
        mailertransport.sendMail(mailOptions, (err, info) => {
           if(err)
             console.log(err)
           else
             console.log(info);
        });
        
            return resolve();
        });
    },

    forgotUserName : function(user) {
        
        return new Promise(function(resolve, reject) 
        {
            var emailtext = "<body> Hello 999,<br /> This is the email you you requested to confirm your Soccer Rally Arena User Name.<br /> Thanks<br /> LAVASKULL</body>"
            emailtext = emailtext.replace("999", user.username);    
            
            const mailOptions = {
          from: 'passwords@lavaskull.com', // sender address
          to: user.email, // list of receivers
          subject: 'Forgot UserName', // Subject line
          html: emailtext// plain text body
            };
        
        mailertransport.sendMail(mailOptions, function (err, info) {
           if(err)
             console.log(err)
           else
             console.log(info);
        });
        
            return resolve();
        });
        
    },
    canReplaceGuestUser : function(new_username, old_username) {
        return User.findOne({ username: new_username }).exec().then(function(user){
        return new Promise(function(resolve, reject) 
        {    
            if(new_username != old_username && user != undefined)
            {
                console.log("[replaceGuestUser]: new username is already taken!");
                
                return reject(errors.usernameAlreadyInUse);
            }
            
            return resolve();
            });
        });
	},        
    replaceGuestUser : function(new_username, password, email, old_username) {
        return new Promise(function(resolve, reject) {
            
             User.findOneAndUpdate({ username: old_username }, {username: new_username, password: password, email: email, guest: false }, {}, 
                function(err, result)
                {
                    if(!err)
                    {
                        console.log(result);
                        return resolve(result);
                    }
                    else
                    {
                        return reject(errors.itemNotFound);
                    }
                });
          });
	},                                                                
    renameUser : function(username, password, new_username) {
        return User.findOne({ username: new_username }).exec().then(function(user) {
        return new Promise(function(resolve, reject) 
        {
            if(user != undefined)
                return reject(errors.usernameAlreadyInUse);
            
             User.findOneAndUpdate({ username: username }, {username: new_username}, {}, 
                function(err, result)
                {
                    if(!err)
                    {
                        console.log(result);
                        resolve(result);
                    }
                    else
                    {
                        reject(errors.itemNotFound);
                    }
                });
			 });
		});
	},
    resendVerify : function(username, password, updated_email) {
        return User.findOne({ username: username }).exec().then(function(user) {
        return new Promise(function(resolve, reject) 
        {
             User.findOneAndUpdate({ username: username }, {email: updated_email}, {}, 
                function(err, result)
                {
                    if(!err)
                    {
                        console.log(result);
                        resolve(result);
                    }
                    else
                    {
                        reject(errors.itemNotFound);
                    }
                });
			 });
		});
	},
    confirmEmailAddress : function(user_id) {
        console.log("[confirmEmailAddress]: " + user_id);
        return User.findOne({ _id: user_id }).exec().then(function(user) {
        return new Promise(function(resolve, reject) 
        {
             User.findOneAndUpdate({ _id: user_id }, {isemailverified: true}, {}, 
                function(err, result)
                {
                    console.log("[confirmEmailAddress] result! " + JSON.stringify(result));
                    if(!err)
                    {
                        result.isemailverified = true;
                        
                        console.log("[confirmEmailAddress] success! " + JSON.stringify(user));
                        console.log(result);
                        resolve(result);
                    }
                    else
                    {
                          console.log("[confirmEmailAddress] failed!");
                        reject(errors.itemNotFound);
                    }
                });
			 });
		});
	},
	createNewUser : async function(username, id, platform) {
		var account = new User();
		account.username = username;

		if (platform === 'Debug') {
			account.password = id;
			account.platform = 0;
		} else {
			account.ids.push(id);
			if (platform === 'Android')
				account.platform = 2;
			else
				account.platform = 1;
		}
		account.guest = false;
        account.isemailverified = false;
		return await account.save();
	},
    createNewGuestUser : async function(username, password, platform) {
		var account = new User();
		account.username = username;

		if (platform === 'Debug') {
			account.platform = 0;
		} else {
			//account.ids.push(id);
			if (platform === 'Android')
				account.platform = 2;
			else
				account.platform = 1;
		}
		account.guest     = true;
        account.password  = password;
        
		return await account.save()
	},
    createNewLavaSkullUser : async function(username, password, email, platform) {
		
        var account       = new User();
		
        account.username  = username;
        account.password  = password;
        account.email     = email;
        account.guest     = false;
        account.isemailverified = false;
		if (platform === 'Debug') {
			account.platform = 0;
		} else {
			//account.ids.push(id);
			if (platform === 'Android')
				account.platform = 2;
			else
				account.platform = 1;
		}
		return await account.save();
	},
    generatePassword : function() {
        var password = strongPaswordGenerator.generatePassword(defaultPasswordConfig);
        console.log("generated password: " + password);
        return password;
    },
	findUserByUsername : function(username) {
		
        return User.findOne({ username: username }).exec().then(function(user){
            return new Promise(function(resolve, reject) {            
                if(!user)
                {
                    //console.log("[findUserByUsername]: username is already taken!");
                    return reject(errors.userNotFoundError);
                }
                return resolve(user);
			 });
		});
        
		/*var platformId = (platform === 'Android') ? 2 : (platform === 'iOS') ? 1 : 0;
		
		return User.findOne({
			username : username,
			platform : platformId
		}).exec().then(function(user) {
			return new Promise(function(resolve, reject) {
				if (!user) {
					reject(errors.userNotFoundError);
				} else {
					resolve(user);
				}
			});
		});*/
	},
    findUserByEmail : function(email, platform) {
        console.log("[findUserByEmail]: " + email);
        return User.findOne({ email: email }).exec().then(function(user){
            return new Promise(function(resolve, reject) {            
                if(!user)
                {
                    console.log("[findUserByEmail]: " + email + " NOT FOUND");
                    return reject(errors.userNotFoundError);
                }
                console.log("[findUserByEmail]: FOUND");
                return resolve(user);
			 });
		});
	},
	findUserById : function(id) {
		return User.findById(id).exec().then(function(user) {
			return new Promise(function(resolve, reject) {
				if (!user) {
					reject(errors.userNotFoundError);
				} else {
					resolve(user);
				}
			});
		});
	},
	getSimplifiedUser : function(user){
		//Return a user without critical information
		var usr = user.toObject();
//		delete usr.password;
//		delete usr.unlockedItems;
		return usr;
	},
	comparePassword : function(user, password) {
		return user.comparePassword(password).then(function(isMatch) {
			return new Promise(function(resolve, reject) {
				if (!isMatch) {
					reject(errors.passwordIncorrect)
				}
				// TODO get rid of these relative paths
				var token = jwt.sign({
					_id : user._id
				}, require('../../../config').secret, {
					expiresIn : '1d'
				});

				var usr = methods.getSimplifiedUser(user);
				resolve([ JSON.stringify(usr), token ]);
			});
		});
    },
    compareGuestPassword : function(user, password) {     
        return new Promise(function(resolve, reject) 
        {
            var result = user.compareGuestPassword(password);
			if (!result) 
            {
				reject(errors.passwordIncorrect)
            }
            // TODO get rid of these relative paths
            var token = jwt.sign({
                _id : user._id
            }, require('../../../config').secret, {
                expiresIn : '1d'
            });

            var usr = methods.getSimplifiedUser(user);
            resolve([ JSON.stringify(usr), token ]);
        });
	},
	 compareLavaSkullPassword : function(user, password) {     
        return new Promise(function(resolve, reject) 
        {
            var result = user.compareLavaSkullPassword(password);
			if (!result) 
            {
				reject(errors.passwordIncorrect)
            }
            // TODO get rid of these relative paths
            var token = jwt.sign({
                _id : user._id
            }, require('../../../config').secret, {
                expiresIn : '1d'
            });

            var usr = methods.getSimplifiedUser(user);
            resolve([ JSON.stringify(usr), token ]);
        });
	},
    compareId : function(user, id) {
		return new Promise(function(resolve, reject) {

			var result = _.some(user.ids, function(_id) {
				return id === _id;
			});

			if (!result) {
				reject(errors.idIncorrect)
			}

			var token = jwt.sign({
				_id : user._id
			}, require('../../../config').secret, {
				expiresIn : '1d'
			});

			var usr = methods.getSimplifiedUser(user);
			resolve([ JSON.stringify(usr), token ]);
		});
	},
    validateToken : function(id,token) {
		return new Promise(function(resolve, reject) {
			var token = req.body.token || req.query.token
					|| req.headers['x-access-token'];
			if (!token) {
				reject(errors.noToken);
			} else {
				resolve(token);
			}
		});
	},
	validateFields : function(req) {
		return new Promise(function(resolve, reject) {
			var token = req.body.token || req.query.token
					|| req.headers['x-access-token'];
			if (!token) {
				reject(errors.noToken);
			} else {
				resolve(token);
			}
		});
	},
	decodeToken : function(req, token) {
		return new Promise(function(resolve, reject) {
			jwt.verify(token, require('../../../config').secret, function(err,
					decoded) {
				if (err) {
					reject(errors.authenticationError);
				} else {
					req.decoded = decoded;
					resolve(decoded);
				}
			});
		})
		.then( function(decoded){
			return methods.findUserById( decoded._id )
			.then( function(user) {
				decoded._user = user
			} )
		} )
	},
	getGoogleOAuthCerts : function() {
		return request.getAsync({
			url : 'https://www.googleapis.com/oauth2/v3/certs',
			json : true
		}).get(1)
	},
	// MAIN AUTH METHODS
	debugAuth : function(payload) {
		return payload.password;
	},
	androidAuth : function(payload) {
        return payload.password;
        /*
		var segments = payload.id_token.split('.');
		var header = new Promise(function(resolve, reject) {
			try {
				resolve(JSON.parse(base64urlDecode(segments[0])));
			} catch (e) {
				return reject(errors.invalidPayloadError);
			}
		});

		return Promise.join(methods.getGoogleOAuthCerts(), header, function(
				response, header) {

			return new Promise(function(resolve, reject) {
				var idtokenBody = JSON.parse(base64urlDecode(segments[1]));
				if ((Date.now() / 1000 | 0) > idtokenBody.exp) {
					return reject(errors.tokenExpired);
				}

				var key = '';
				for (var i = 0; i < response.keys.length; i++) {
					if (response.keys[i].kid === header.kid) {
						key = response.keys[i];
						break;
					}
				}

				if (jws.verify(payload.id_token, key)) {
					var info = JSON.parse(base64urlDecode(segments[1]));
					return resolve(info.sub);
				} else {
					return reject();
				}
			});
		});*/
	},
	iosAuth : function(payload) {
        return payload.password;
        /*
		return request.getAsync({
			url : payload.publicKeyUrl,
			encoding : null
		}).spread(
				function(response, body) {
					return new Promise(function(resolve, reject) {
						if (response.statusCode == 200) {
							var verifier = crypto.createVerify("sha256");
							verifier.update(payload.playerId, "utf8");
							verifier.update(payload.bundleId, "utf8");

							var buf = ref.alloc('uint64');
							ref.writeUInt64BE(buf, 0, payload.timestamp
									.toString());

							verifier.update(buf);
							verifier.update(payload.salt, 'base64');

							var pmd = '-----BEGIN CERTIFICATE-----';

							var base64 = body.toString('base64');
							var size = base64.length;

							for (var i = 0; i < size; i = i + 64) {
								var end = i + 64 < size ? i + 64 : size;
								pmd = pmd + '\n' + base64.substring(i, end);
							}

							pmd = pmd + '\n-----END CERTIFICATE-----';

							var valid = verifier.verify(pmd, payload.signature,
									"base64");

							if (valid) {
								return resolve(payload.playerId.toString());
							} else {
								return reject(errors.invalidPayloadError);
							}
						} else {
							return reject(errors.invalidIOSCertError);
						}
					});
				});*/
	},
	facebookAuth : function(token) {
		return request.getAsync({
			url : 'https://graph.facebook.com/me?access_token=' + token,
			json : true
		})
	},
	googleAuth : function(token) {
		return request
				.getAsync({
					url : 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token='
							+ token,
					json : true
				})
	},
	// todo check if we can simply store the id under ids
	connectFacebook : async function(response, user) {
		user.linked.facebook = {
			"id" : response.id,
			"email" : response.email,
			"first_name" : response.first_name,
			"last_name" : response.lastName,
		};

		return await user.save();
	},
	connectGoogle : async function(response, user) {
		user.linked.google = {
			"id" : response.user_id
		};

		return await user.save();
    }
    
}

// function base64urlDecode(str) {
// 	return new Buffer(base64urlUnescape(str), 'base64').toString('ascii');
// };

// function base64urlUnescape(str) {
// 	str += Array(5 - str.length % 4).join('=');
// 	return str.replace(/\-/g, '+').replace(/_/g, '/');
// }

module.exports = methods



