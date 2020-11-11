var NOTIFICATIONS= {
	friendAddedSuccessfully: {
        success: true,
        message: 'friend successfully added'
    },
    friendRemovedSuccessfully: {
        success: true,
        message: 'friend successfully removed'
    },
    requestSentSuccessfully: {
    	success: true,
    	message: 'request sent successfully'
    },
    requestRemovedSuccessfully: {
    	success: true,
    	message: 'request removed successfully'
	},
    userUnblockedSuccessfully: {
    	success: true,
    	message: 'user removed from blocked successfully'
    },	
    accountCreated: {
    	success: true,
    	message: 'account was created successfully'
    },
    userRenamed: {
    	success: true,
    	message: 'user renamed successfully'
    },
    verificationResent: {
    	success: true,
    	message: 'verification email sent successfully'
    },
    loggedin:{
    	success: true,
    	message: 'login successful',
    	token: '',
    	user: '',
        gameversion: '',
        gameversion_android: '',
        gameversion_ios: '',
        dailyrewardcar: ''
    },
    loggedout:{
    	success : true,
		message : 'succesfully logged out.'
    },
    allFriends: {
    	success: true,
    	message: 'retrieved all friends',
    	friends: ''
    },
    allFriendRequests: {
    	success: true,
    	message: 'retrieved all friend requests',
    	requests: ''
	},
    allBlockedFriends: {
    	success: true,
    	message: 'retrieved all blocked friend',
    	blocked: ''
    },	
    profileUpdated: {
    	success: true,
    	message: 'profile succesfully updated',
    },
    socialNetworkConnected : {
		success : true,
		message : 'success connected'
	},
	joinedAsTeam : {
		success : true,
		message : 'joined as team.'
	},
	leftQueue : {
		success : true,
		message : 'left the queue.'
	},
	leftLobby : {
		success : true,
		message : 'left the lobby.'
	},
	leftMatch : {
		success : true,
		message : 'left the match.'
	},
	scoreAdded : {
		success : true,
		message : 'Score added.'
	},
	matchCompleted : {
		success : true,
		message : 'match completed.'
	},
    validToken : {
    	success : true,
		message : 'token is valid.'
    },
    forgotpassword : {
    	success : true,
		message : 'request sent.'
    },
    forgotUserName : {
    	success : true,
		message : 'request sent.'
    },
    xpreset:{
    	success: true,
    	message: 'xp reset successfully',
    	user: ''
    },
    xpinc: {
    	success: true,
    	message: 'xp has been increased successfully',
        xp: ''
    },
    fakeonlineusefuel: {
    	success: true,
    	message: 'success',
        fuel: ''
    },
    retreivelimiteditems: {
    	success: true,
    	message: 'retrieved limited items',
    	items: []
    },
    dailyRewardResponse: {
    	success: true,
    	srd: '',
        xp: '',
        unlock: ''
    },
    refreshedHighScoreGameState: {
    	success: true,
    	game: '',
        gameIndex: ''
    },
    claimedHighScoreReward: {
    	success: true,
    	game_id: '',
        gameIndex: '',
        srd: '',
        xp: ''
	},
	refreshedLeagueState: {
		success: true, 
		league: '',
		league_id: ''
	}
}

module.exports = NOTIFICATIONS;