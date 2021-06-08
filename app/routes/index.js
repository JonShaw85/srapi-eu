var express = require('express');
var router = new express.Router();
var auth = require('../controllers/auth');
var friends = require('../controllers/friends');
var profile = require('../controllers/profile');
var skills = require('../controllers/Skills');
var Matchmaker = require('../matchmaking/matchmaker');
var currency = require('../controllers/currency');
var limited = require('../controllers/limited');
var unlockables = require('../controllers/unlockables');
var iap = require('../controllers/iap');
var limiter = require('express-limiter')(router)
var config = require('./../../config');
var highscoremode = require('../controllers/highscoremode');
var playerleague = require('../controllers/playerleague')
var leaderboard = require('./../controllers/leaderboard');

const Push = require('../controllers/PushNotification')
var matchmaker = new Matchmaker;
matchmaker.start();

// Public methods
/**
 * @api {post} /register Register
 * @apiName Register
 * @apiGroup Accounts
 * @apiPermission none
 * @apiVersion 1.0.0
 * 
 * @apiSuccessExample {json} Response: { success: true, message: 'account was
 *                    created successfully' }
 * 
 * @apiParam {String} username
 * @apiParam {String} platform Debug/Android/iOS
 * @apiParam {Object[]} payload Payload takes different parameters per platform
 *           for authentication
 * @apiParam {String} payload.device_id Send across the system UID. C# Example:
 *           SystemInfo.deviceUniqueIdentifier
 * @apiParam {String} [payload.email] (Debug only)
 * @apiParam {String} [payload.password] (Debug only)
 * @apiParam {String} [payload.id_token] (Android only) Google services id_token
 * @apiParam {String} [payload.publicKeyUrl] (iOS only) GameCenter supplied url
 * @apiParam {String} [payload.playerId] (iOS only) GameCenter player ID
 * @apiParam {String} [payload.bundleId] (iOS only) App bundle identifier.
 *           example: nl.superbuff.soccerrallyarena
 * @apiParam {String} [payload.timestamp] (iOS only) GameCenter supplied
 *           timestamp
 * @apiParam {String} [payload.salt] (iOS only) GameCenter supplied salt
 * 
 * @apiParamExample {json} Post-Example: { "username":"example_username",
 *                  "platform":"Debug", "payload": { "password":"somepassword",
 *                  "device_id":"12345" } }
 */
router.post('/register', auth.register);
// Public methods
/**
 * @api {post} /registergurest Register
 * @apiName Register
 * @apiGroup Accounts
 * @apiPermission none
 * @apiVersion 1.0.0
 * 
 * @apiSuccessExample {json} Response: { success: true, message: 'account was
 *                    created successfully' }
 * 
 * @apiParam {String} username
 * @apiParam {String} platform Debug/Android/iOS
 * @apiParam {Object[]} payload Payload takes different parameters per platform
 *           for authentication
 * @apiParam {String} payload.device_id Send across the system UID. C# Example:
 *           SystemInfo.deviceUniqueIdentifier
 * @apiParam {String} [payload.email] (Debug only)
 * @apiParam {String} [payload.password] (Debug only)
 * @apiParam {String} [payload.bundleId] (Mobile only) App bundle identifier.
 *           example: nl.superbuff.soccerrallyarena
 * @apiParamExample {json} Post-Example: { "username":"example_username",
 *                  "platform":"Debug", "payload": { "password":"somepassword",
 *                  "device_id":"12345" } }
 */
router.post('/registerguest', auth.registerguest);
/**
/**
 * @api {post} /login Log in
 * @apiName Log in
 * @apiGroup Accounts
 * @apiPermission none
 * @apiVersion 1.0.0
 * 
 * @apiSuccess {String} token JSON Web Token used for authentication. Save
 *             locally.
 * @apiSuccess {String} user User object as stored in the database.
 * @apiSuccess {String} user.statistics Virtual save slot for data up to 1MB.
 * @apiSuccessExample {json} Response: { success: true, message: 'login
 *                    successful', token: 'Generate JWT Token', user: 'User
 *                    Profile Data' }
 * @apiSuccessExample {json} User-Object: { "username":"zophiel",
 *                    "statistics":"{"some_stats":"1337"}", "social": {
 *                    "friendRequests":[], "friends":[] }, "elo":1400, "ids":[] }
 * 
 * @apiParam {String} username
 * @apiParam {String} platform Debug/Android/iOS
 * @apiParam {Object[]} payload Payload takes different parameters per platform
 *           for authentication
 * @apiParam {String} payload.device_id Send across the system UID. C# Example:
 *           SystemInfo.deviceUniqueIdentifier
 * @apiParam {String} [payload.email] (Debug only)
 * @apiParam {String} [payload.password] (Debug only)
 * @apiParam {String} [payload.id_token] (Android only) Google services id_token
 * @apiParam {String} [payload.publicKeyUrl] (iOS only) GameCenter supplied url
 * @apiParam {String} [payload.playerId] (iOS only) GameCenter player ID
 * @apiParam {String} [payload.bundleId] (iOS only) App bundle identifier.
 *           example: nl.superbuff.soccerrallyarena
 * @apiParam {String} [payload.timestamp] (iOS only) GameCenter supplied
 *           timestamp
 * @apiParam {String} [payload.salt] (iOS only) GameCenter supplied salt
 * @apiParam {String} [version] Game version (must fit server version)
 * 
 * @apiParamExample {json} Post-Example: { "username":"example_username",
 *                  "platform":"Debug", "payload": { "password":"somepassword",
 *                  "device_id":"12345" } }
 */
router.post('/login', auth.login);
/**
/**
 * @api {post} /login Log in
 * @apiName Log in
 * @apiGroup Accounts
 * @apiPermission none
 * @apiVersion 1.0.0
 * 
 * @apiSuccess {String} token JSON Web Token used for authentication. Save
 *             locally.
 * @apiSuccess {String} user User object as stored in the database.
 * @apiSuccess {String} user.statistics Virtual save slot for data up to 1MB.
 * @apiSuccessExample {json} Response: { success: true, message: 'login
 *                    successful', token: 'Generate JWT Token', user: 'User
 *                    Profile Data' }
 * @apiSuccessExample {json} User-Object: { "username":"zophiel",
 *                    "statistics":"{"some_stats":"1337"}", "social": {
 *                    "friendRequests":[], "friends":[] }, "elo":1400, "ids":[] }
 * 
 * @apiParam {String} username
 * @apiParam {String} platform Debug/Android/iOS
 * @apiParam {Object[]} payload Payload takes different parameters per platform
 *           for authentication
 * @apiParam {String} payload.device_id Send across the system UID. C# Example:
 *           SystemInfo.deviceUniqueIdentifier
 * @apiParam {String} [payload.email] (Debug only)
 * @apiParam {String} [payload.password] (Debug only)
 * @apiParam {String} [payload.bundleId] (Mobile only) App bundle identifier.
 *           example: nl.superbuff.soccerrallyarena
 * @apiParam {String} [version] Game version (must fit server version)
 * 
 * @apiParamExample {json} Post-Example: { "username":"example_username",
 *                  "platform":"Debug", "payload": { "password":"somepassword",
 *                  "device_id":"12345" } }
 */
router.post('/loginguest', auth.loginguest);

router.post('/registerlavaskull', auth.registerlavaskull);

router.post('/signinlavaskull', auth.signinlavaskull);

router.post('/signinlavaskullemail', auth.signinlavaskullemail);

router.post('/renameuser', auth.renameuser);

router.post('/resendverify', auth.resendverify);

router.post('/validateToken', auth.validateToken);

router.post('/forgotpassword', auth.forgotpassword);

router.post('/forgotUserName', auth.forgotUserName);

/**
 * IronSource callback, unlock an item after watching a video
 * Method: GET
 * Query Params: applicationUserId, rewards, eventId, itemName, signature, timestamp
 * Response: JSON List of items unlocked and things earned
 */
router.get('/video/unlock', unlockables.unlockItemVideo);

/**
 * IronSource callback, add a multiplier to next SRD gain
 * Method: GET
 * Query Params: applicationUserId, rewards, eventId
 * Response: JSON {"success": true, "multiplier": 2}
 */
router.get('/video/mult', currency.addMultiplierVideo);

/**
 * Return server version
 * Method: GET
 * Response: JSON {"version": "1.01"}
 */
router.get('/version', auth.getVersion);

// Security, all requests after that requires authentification
router.use(auth.token);

/**
 * @api {get} /logout Log out
 * @apiName Log out
 * @apiGroup Accounts
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Disconnects the session from the submitted
 *                 <code>device_id</code>. Allowing users to log in with
 *                 other devices.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Response: { success : true, message : 'successfully
 *                    logged out.' }
 */
router.get('/logout', auth.logout);
// Social Connectors
// router.post('/connect/google', auth.connectGoogle);
// router.post('/connect/facebook', auth.connectFacebook);
// Friends methods
/**
 * @api {get} /friends Friends
 * @apiName Friends
 * @apiGroup Friends
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Retrieves all your friends.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Response: { success: true, message: 'retrieved all
 *                    friends', friends: '' }
 * @apiSuccessExample {json} Friends-Object: "friends": [
 *                    "{\"user_id\":\"57161b372fafe81100e2f394\",\"name\":\"Kevin\"}",
 *                    "{\"user_id\":\"571644f82fafe81100e2f397\",\"name\":\"Ralph\"}",
 *                    "{\"user_id\":\"5716450e2fafe81100e2f398\",\"name\":\"Derek\"}",
 *                    "{\"user_id\":\"5717619d53ad7e1100f31747\",\"name\":\"Juggernaut8919\"}" ]
 */
router.get('/friends', friends.allfriends); // get all your friends
/**
 * @api {get} /friends/:id Get potential friends
 * @apiName Profile
 * @apiGroup Profile
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Retrieves all partial username matches.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Response Object: "[
 *                    "{\"user_id\":\"57161b372fafe81100e2f394\",\"username\":\"Kevin\"}",
 *                    "{\"user_id\":\"571644f82fafe81100e2f397\",\"username\":\"Ralph\"}",
 *                    "{\"user_id\":\"5716450e2fafe81100e2f398\",\"username\":\"Derek\"}",
 *                    "{\"user_id\":\"5717619d53ad7e1100f31747\",\"username\":\"Juggernaut8919\"}" ]"
 */
router.get('/friends/:id', friends.findfriends)
router.get('/friends/:id/blocked/:list', friends.findnotblockedfriends)
router.get('/friends/blocking/:username', friends.getUsersblockingYou)
/**
 * @api {delete} /friends/:id Delete Friend
 * @apiName Delete Friend
 * @apiGroup Friends
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Deletes friend with <code>:id</code>
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Response: { success: true, message: 'friend
 *                    successfully removed' }
 */
router['delete']('/friends/:id', friends.removefriend) // delete a friend

/**
 * @api {get} /friends/requests Get Friend Requests
 * @apiName Get Friend Requests
 * @apiGroup Friends
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Retrieves all outstanding friend requests.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Response: { success: true, message: 'retrieved all
 *                    friend requests', requests: '' }
 * @apiSuccessExample {json} Requests-Object: {[ "57161c182fafe81100e2f396" ]}
 */
router.get('/friends/requests/all', friends.allfriendrequests); // get all your
// friends

router.get('/friends/requests/all1', friends.allfriendrequests1); // get all your
// friends

router.get('/friends/requests/all2', friends.allfriendrequests2); // get all your
// friends

/**
 * @api {get} /friends/blocked/all Get Friend Requests
 * @apiName Get Blocked Friend 
 * @apiGroup Friends
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Retrieves all outstanding blocked friendss.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Response: { success: true, message: 'retrieved all
 *                    friend requests', requests: '' }
 * @apiSuccessExample {json} Requests-Object: {[ "57161c182fafe81100e2f396" ]}
 */
router.get('/friends/blocked/all', friends.allblockedfriends);

/**
 * @api {get} /friends/requests/pending Get Friend Requests
 * @apiName Get Friend pending Requests
 * @apiGroup Friends
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Retrieves all the pending friend requests send.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Response: { success: true, message: 'retrieved all
 *                    friend requests', requests: '' }
 * @apiSuccessExample {json} Requests-Object: {[ "57161c182fafe81100e2f396" ]}
 */
router.get('/friends/requests/pending', friends.pendingfriendrequests); // get all your pending sent requests


/**
 * @api {get} /friends/blocked/:name block user
 * @apiName block Friend
 * @apiGroup Friends
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription add an user as blocked <code>:name</code>
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Response: { success: true, message: 'request sent
 *                    successfully' }
 */
router.get('/friends/blocked/:id', friends.blockfriend); // blockfriend (id is username)


/**
 * @api {delete} /friends/requests/:id Delete user from blocked friends
 * @apiName Delete user from blocked friends
 * @apiGroup Friends
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Delete user from blocked friends <code>:id</code>.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Response: { success: true, message: 'request
 *                    removed successfully' }
 */
router['delete']('/friends/blocked/:id', friends.removeBlocked); // remove user from blocked list

/**
 * @api {get} /friends/requests/:name Send Friend Request
 * @apiName Send Friend Request
 * @apiGroup Friends
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Send a friend request to user with <code>:name</code>
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Response: { success: true, message: 'request sent
 *                    successfully' }
 */
router.get('/friends/request/:id', friends.requestfriend); // request friend
// add;
/**
 * @api {post} /friends/requests/:id Accept Friend Request
 * @apiName Accept Friend Request
 * @apiGroup Friends
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Accept Friend Request with <code>:id</code>.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Response: { success: true, message: 'friend
 *                    successfully added' }
 */
router.post('/friends/request/:id', friends.acceptfriend); // accept request
/**
 * @api {delete} /friends/requests/:id Delete Friend Request
 * @apiName Delete Friend Request
 * @apiGroup Friends
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Delete Friend Request with <code>:id</code>.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Response: { success: true, message: 'request
 *                    removed successfully' }
 */
router['delete']('/friends/request/:id', friends.declinefriend); // decline
router.post('/friends/request/cancel/:id', friends.cancelRequest); // decline
// request
// Profile methods
/**
 * @api {put} /profile/stats Save data
 * @apiName Save Data
 * @apiGroup Profile
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Save data to a profile. 1MB size cap, only takes string data.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Response: { success: true, message: 'profile
 *                    succesfully updated' }
 * @apiParamExample {json} Post-Example: { "stat":"any kind of serialized string
 *                  data." }
 */
router.put('/profile/stats', profile.setStats);
/**
 * @api {get} /profile/:id Get User Profile
 * @apiName Get User Profile
 * @apiGroup Profile
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Get user profile from supplied <code>:id</code>.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} User-Object: { "username":"zophiel",
 *                    "statistics":"{"some_stats":"1337"}", "social": {
 *                    "friendRequests":[], "friends":[] }, "elo":1400, "ids":[] }
 */
router.get('/profile/:id', profile.get);
router.get('/profile/:username/byname', profile.getByName);
router.get('/profile/:id/elo', profile.getElo);
router.post('/profile/GetCarLevel', profile.getCarLevel);
router.post('/profile/SetCarLevel', profile.setCarLevel);
router.post('/profile/resetCarLevel', profile.resetCalLevels);
/**
 * @api {get} /leaderboard Get Leaderboard
 * @apiName Get Leaderboard
 * @apiGroup Leaderboard
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Get total leaderboard, sorted on elo, descending. Returns
 *                 array of users.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Leaderboard-Object: [{ "username":"zophiel",
 *                    "statistics":"{"some_stats":"1337"}", "social": {
 *                    "friendRequests":[], "friends":[] }, "elo":1400, "ids":[] }, {
 *                    "username":"Ralph", "statistics":"{"some_stats":"w00t"}",
 *                    "social": { "friendRequests":[], "friends":[] },
 *                    "elo":1400, "ids":[] }]
 */
router.get('/leaderboard', leaderboard.readLeaderboard);

/**
 * @api {get} /leaderboard/:page Get Leaderboard page
 * @apiName Get Leaderboard page
 * @apiGroup Leaderboard
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Get total leaderboard, sorted on elo, descending. Returns
 *                 array of users. Supply <code>:page</code> number for
 *                 selected result.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Leaderboard-Object: [{ "username":"zophiel",
 *                    "statistics":"{"some_stats":"1337"}", "social": {
 *                    "friendRequests":[], "friends":[] }, "elo":1400, "ids":[] }]
 */
router.get('/leaderboard/:page',);
/**
 * @api {get} /match/ Join Game
 * @apiName Join Game
 * @apiGroup Matchmaking
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Join the queue for a game id. Expires after 4 seconds. Users
 *                 should call this path every 3 seconds.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiHeader x-gametype Selected gametype: 1v1, 2v2, 3v3.
 * @apiSuccessExample {json} In Queue: { status : 'searching', gametype : '1v1',
 *                    gameid : 'none' }
 * @apiSuccessExample {json} In Lobby: { status : 'waiting', gametype : '1v1',
 *                    gameid : '1284c3-hiehwf9723-fj93h92-1204', team : 0 }
 * @apiSuccessExample {json} In Lobby: { status : 'ready', gametype : '1v1',
 *                    gameid : '1284c3-hiehwf9723-fj93h92-1204', team : 0 }
 */
router.get('/match', limiter({
	lookup: ['decoded._id', 'connection.remoteAddress'],
	total: 1,//
	expire: 1000 * 2, // in ms
	onRateLimited: function (req, res, next) {
		console.log("[onRateLimited]: user with id " + req.decoded._id + " has exceeded the rate limit!");
		return res.status(429).json({
			message: 'Rate limit exceeded',
			status: 429
		})
	}
}), matchmaker.queue.bind(matchmaker))

router.post('/matchrequest', matchmaker.queue.bind(matchmaker))
router.post('/match', matchmaker.queueAsTeam.bind(matchmaker))

/**
 * Made for queueing as a three v three in the new photon matchmaking system
 */
router.post('/match/threevthree', matchmaker.queueAsThreeVThree)
router.post('/match/queue', matchmaker.queue)
router.post('/match/forefit', matchmaker.forefitMatch)
router.post('/match/giveforefitback', matchmaker.giveforefitback)


/**
 * @api {delete} /match/ Leave Game
 * @apiName Leave Game
 * @apiGroup Matchmaking
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Leave either the queue or lobby.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Response: { success : true, message : 'left the
 *                    lobby/queue.' }
 */
router['delete']('/match', matchmaker.leave)
/**
 * @api {post} /match/complete/:team Complete Game
 * @apiName Complete Game
 * @apiGroup Matchmaking
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Complete game with <code>team</code> as winner.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Response: { success : true, message : 'match
 *                    completed.' }
 */
router.post('/match/complete/:team', matchmaker.complete);
/**
 * @api {get} /match/report/:id Game Report
 * @apiName Game Report
 * @apiGroup Matchmaking
 * @apiPermission Session
 * @apiVersion 1.0.0
 * 
 * @apiDescription Get Report of completed game by <code>:id</code>. Returns
 *                 elo changes.
 * 
 * @apiHeader x-access-token Session <code>token</code> returned during
 *            <code>/login</code>
 * @apiSuccessExample {json} Response: { teamOneGain : -16, teamTwoGain : 18 }
 */
router.get('/match/report/:id', matchmaker.report);

/**
 * Send SRD gained during match to server
 * Method: POST
 * Header: x-access-token Session token returned during login
 * Body: JSON {"match_id": 11, "srd": 50, "goals": 3}
 * Response: JSON {"success": true, "srd": 5, "goals": 2, "win": 1}
 */
router.post('/match/score', matchmaker.score);

router.post('/match/endofmatch', matchmaker.endOfMatchEloResult)

router.post('/match/matchResult', matchmaker.newMatchResult)

/**
	Update elo/xp/srd for fake online matches - where an online match cannot be found - and so we put ai in!
*/

router.post('/match/fakeonlineresult', matchmaker.fakeonlinescore);

/**
 * Return SRD and FUEL
 * Method: GET
 * Header: x-access-token Session token returned during login
 * Response: JSON {"srd": 5, "fuel": 2}
 */
router.get('/srd', currency.getSRD);

/**
 * Check if player waited enough to gain more fuel, and return fuel amount
 * Method: GET
 * Header: x-access-token Session token returned during login
 * Response: JSON {"srd": 5, "fuel": 2}
 */
router.get('/fuel', currency.refillFuel);

/**
 * Add a multiplier to the next SRD gain (usually after watching video)
 * Method: GET
 * Header: x-access-token Session token returned during login
 * Body: JSON {multiplier: 2} //Or default to 2 if using GET
 * Response: JSON {"success": true, "multiplier": 2}
 */
//router.get('/srd/mult', currency.addMultiplier);
//router.post('/srd/mult', currency.addMultiplier);

/**
 * Return a list of all unlockable items
 * Method: GET
 * Header: x-access-token Session token returned during login
 * Response: JSON List of all items
 */
router.get('/items/all', unlockables.getAllItems);

/**
 * Return a list of all unlocked items by the player
 * Method: GET
 * Header: x-access-token Session token returned during login
 * Response: JSON List of all items unlocked by current player
 */
router.get('/items/unlocked', unlockables.getUnlockedItems);

/**
 * Unlock a list of items
 * Method: POST
 * Header: x-access-token Session token returned during login
 * Body: JSON {items: ["Item A", "Item B"]}
 * Hint: If you want an item to be unlocked multiple times, put BitIndex of the item to 0, 
 * 		 multiple items can have the BitIndex 0
 * Response: JSON List of items unlocked and things earned
 */
router.post('/items/unlock', unlockables.unlockItems);

/**
 * Lock a list of items (just for testing purpose, not an actual feature)
 * Method: POST
 * Header: x-access-token Session token returned during login
 * Body: JSON {items: ["Item A", "Item B"]}
 * Response: JSON List of items locked
 */
router.post('/items/lock', unlockables.lockItems);

/**
 * Unlock an item using reward instead of SRD price
 * Method: POST
 * Header: x-access-token Session token returned during login
 * Body: JSON {item_name: "Item A"}
 * Response: JSON List of items unlocked and things earned
 */
router.post('/items/reward', unlockables.unlockItemReward);

/**
 * Developer way to unlock an item for a player when a purchase fails
 * 1: Pass in username string
 * 2: pass in the items bit index
 */
router.get('/items/devreward', unlockables.devUnlockMiddleware);

/**
 * Returns the users unlock string as binary code
 */
router.get("/items/unlockString", unlockables.getUnlockBinaryString);

/**
 * Count number of available rewards
 * Method: GET
 * Header: x-access-token Session token returned during login
 * Response: JSON List of items unlocked and things earned
 */
router.get('/items/reward/count', unlockables.countRewards);

/**
 * Validate a IAP receipt and unlock associated items
 * Method: POST
 * Header: x-access-token Session token returned during login
 * Body: JSON {receipt: (returned by IAP), signature: (returned by IAP)}
 * Response: status 200
 */
router.post('/iap', iap.validateRequest);

/* Test functions */
//router.post('/test', currency.test);
//router.get('/test', currency.test);
//router.post('/iap/test', iap.test);
//router.get('/items/reward/test', unlockables.test_add_match);

router.get('/video/fuel', currency.watchFuelVideo);

router.post('/getgameversion', auth.gameVersion);

router.get('/debug/resetxpandunlocks', currency.resetxpandunlocks);
router.post('/Currency/RemoveSrd', currency.removeSRD)
router.get('/debug/xpincrease', currency.debugAddXP);
router.get('/fakeonline/usefuel', currency.fakeonlineusefuel);

router.get('/video/xpincrease', currency.addXPForVideo);

/*
limited edition related functions
*/
router.get('/limited/items', limited.retreiveItems);
router.get('/limited/purchase', limited.purchaseItem);

// router.get('/getgameversion', (req, res) => {
// 	console.log('Sending game version back to player')
// 	return res.json({ version : config.gameVersion }) 
// })

router.post('/dailyreward/car', unlockables.unlockDailyRewardCar);
router.post('/dailyreward/bonus', currency.addDailyRewardBonus);

/* High score mode */
router.post('/highscoremode/start', highscoremode.start);
router.post('/highscoremode/refresh', highscoremode.refreshGameState);
router.post('/highscoremode/upload', highscoremode.postScore);
router.post('/highscoremode/claim', highscoremode.claim);
router.post('/highscoremode/forceExpire', highscoremode.forceExpireGame);
router.post('/highscoremode/ResetNotification', highscoremode.AllowNotification);


/* Player League */
router.post('/playerleague/start', playerleague.start)
router.post('/playerleague/refresh', playerleague.refreshLeagueState)
router.post('/playerleague/postelo', playerleague.postEloUpdate)
router.post('/playerleague/claimelo', playerleague.claimElo)
router.post('/playerleague/buylpboost', playerleague.buyLpBoost)
router.post('/playerleague/buylpshield', playerleague.buyLpShield)
router.post('/playerleague/expire', playerleague.forceExpireLeague)
router.post('/playerleague/devStart', playerleague.devStart)
router.post('/playerleague/devExpire', playerleague.devExpire)

/* Skills */
router.get('/Skills/GetSkillsLockState', skills.GetSkillsLockState)
router.post('/Skills/SetSkillsLockState', skills.SetSkillsLockState)

Push.FireBaseInit();
router.get('/PushNotification', Push.TestNotie)
router.post('/PushNotificationID', Push.SetFireBaseID)

module.exports = router;