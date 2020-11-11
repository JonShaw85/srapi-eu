var ERRORS = {
	lonely : {
		code : 404,
		success : false,
		message : 'cannot friend yourself. You poor fool.'
	},
	alreadyFriends : {
		code : 409,
		success : false,
		message : 'you are already friends.'
	},
	alreadyBlocked : {
		code : 409,
		success : false,
		message : 'user already blocked'
	},	
	userNotFoundError : {
		code : 405,
		success : false,
		message : 'no user found with that id'
	},
	friendRequestNotFoundError : {
		code : 404,
		success : false,
		message : 'friend request not found'
	},
	userBlockedNotFoundError : {
		code : 404,
		success : false,
		message : 'user blocked not found'
	},	
	friendNotFoundError : {
		code : 404,
		success : false,
		message : 'no friend found with that id'
	},
	illegalIdError : {
		code : 401,
		success : false,
		message : 'illegal id.'
	},
	invalidEmailError : {
		code : 400,
		success : false,
		message : 'email is invalid.'
	},
	invalidUsername : {
		code : 400,
		success : false,
		message : 'invalid characters in username. Letters and numbers only'
	},
	invalidPasswordLength : {
		code : 400,
		success : false,
		message : 'password length less then 8 characters'
	},
	usernameAlreadyInUse : {
		code : 409,
		success : false,
		message : 'username is already taken'
	},
	emailAlreadyInUse : {
		code : 408,
		success : false,
		message : 'email is already registered'
	},
	emailNotFound : {
		code : 404,
		success : false,
		message : 'email not found'
	},
	passwordIncorrect : {
		code : 407,
		success : false,
		message : 'password is incorrect'
	},
	idIncorrect : {
		code : 400,
		success : false,
		message : 'id is incorrect'
	},
	noToken : {
		code : 403,
		success : false,
		message : 'No token provided.'
	},
	tokenExpired : {
		code : 401,
		success : false,
		message : 'Token has expired.'
	},
	authenticationError : {
		code : 403,
		success : false,
		message : 'Failed to authenticate token.'
	},
	invalidBody : {
		code : 401,
		success : false,
		message : 'invalid body. Check your JSON for missing properties.'
	},
	invalidPayloadError : {
		code : 400,
		success : false,
		message : 'invalid payload detected.'
	},
	invalidIOSCertError : {
		code : 400,
		success : false,
		message : 'problem acquiring certificate.'
	},
	platformNotSupported : {
		code : 400,
		success : false,
		message : 'platform not supported'
	},
	loggedOnOtherDevice : {
		code : 403,
		success : false,
		message : 'Logged in on another device. Please logout first',
		user: ''
	},
	invalidGametype:{
		code: 400,
		success : false,
		message : 'no valid gametype found'
	},
	alreadyQueued:{
		code: 401,
		success : false,
		message : 'Already queued or in a game. Please leave first.'
	},
	notFoundInQueue : {
		code : 404,
		success : false,
		message : 'not in a queue or lobby'
	},
	matchWithIdNotFound : {
		code : 400,
		success : false,
		message : 'no match found with that id.'
	},
	cannotLeaveInprogressGame : {
		code : 409,
		success : false,
		message : 'cannot leave match in progress.'
	},
	notInGame : {
		code : 404,
		success : false,
		message : 'not in a game'
	},
	alreadySent : {
		code : 400,
		success : false,
		message : 'Already sent'
	},
	reportNotFound : {
		code : 404,
		success : false,
		message : 'report not found'
	},
	invalidParams : {
		code : 400,
		success : false,
		message : 'Some params are missing'
	},
	invalidParamsValues : {
		code : 400,
		success : false,
		message : 'Some params have invalid values'
	},
	notEnoughSRD : {
		code : 402,
		success : false,
		message : 'Not enough SRD'
	},
	notEnoughFuel : {
		code : 402,
		success : false,
		message : 'Not enough Fuel'
	},
	itemNotFound : {
		code: 404,
		success: false,
		message : 'Item not found'
	},
	purchaseWrongQuantity :{
		code: 400,
		success: false,
		message : 'Purchase quantity is wrong'
	},
	purchaseWrongUser :{
		code: 400,
		success: false,
		message : 'Purchase user is wrong'
	},
	purchaseWrongDate :{
		code: 400,
		success: false,
		message : 'Purchase date is expired'
	},
	purchaseAlreadyValidated :{
		code: 400,
		success: false,
		message : 'Purchase has already been validated'
	},
	purchaseInvalidReceipt :{
		code: 400,
		success: false,
		message : 'Purchase receipt is not valid'
	},
	purchaseTooBig : {
		code: 400,
		success: false,
		message : 'Purchase receipt has too many items'
	},
	wrongSignature : {
		code: 402,
		success: false,
		message : 'Wrong signature'
	},
	rewardNotFound : {
		code: 404,
		success: false,
		message : 'Reward not found'
	},
	rewardRequirementsUnmet : {
		code: 400,
		success: false,
		message : 'Requirements for that reward are not met'
	},
	invalidVersion: {
		code: 400,
		success: false,
		message : 'Version of the game does not match server version'
	},
    HighScoreGameNotFoundError : {
		code: 404,
		success: false,
		message : 'game with the passed in game id not found'
	},
};

module.exports = ERRORS;