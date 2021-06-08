var Promise = require('bluebird');
var mongoose = require('mongoose');
mongoose.Promise = Promise;
var bcrypt = Promise.promisifyAll(require('bcryptjs'));
var Schema = mongoose.Schema;

const carLevel = new Schema({
	carName : {
		type : String,
	},
	level : {
		type : Number
	}
})

const skillsState = new Schema({
	skillJsonKey : {
		type: String
	},
	unlocked : {
		type : Boolean
	}
})

const highscoreresultSchema = new Schema({

    game_id : {
		type : String,
		required : true,
	},
    finishing_pos : {
		type : Number,
        required : true,
	},
    srd_reward : {
		type : Number,
        required : true,
	},
    xp_reward : {
		type : Number,
        required : true,
	}
})

var UserSchema = new Schema({
	username : {
		type : String,
		required : true,
	},
    guest : {
		type : Boolean,
        'default' : false,
	},
	platform :
	{
		type : Number,
		'default' : 5,
		min : 0,
		max : 2
	},
	password : {
		type : String
	},
    email : {
		type : String
	},
    isemailverified : {
		type : Boolean,
        'default' : false,
	},
	ids : [ String ],
	elo : {
		type : Number,
		'default' : 0,
		min : 0
	},
	fuel : {
		type : Number,
		'default' : 12,
		min : 0,
		max : 12
	},
	srd : {
		type : Number,
		'default' : 0,
		min : 0
	},
	matches : {
		type : Number,
		'default' : 0,
		min : 0
	},
	goals : {
		type : Number,
		'default' : 0,
		min : 0
	},
	wins : {
		type : Number,
		'default' : 0,
		min : 0
	},
	unlockedItems : {
		type: String
	},
	linked : {
		facebook : {
			id : String,
			name : String,
			lastName : String,
			email : String
		},
		google : {
			id : String
		}
	},
	social : {
		friends: [],
		friendRequests : [ String ],
		friendsBlocked : [ String ]
	},
    xp : {
		type : Number,
		'default' : 0,
		min : 0
	},
	statistics : String,
    highscoreresults : {
		type : [highscoreresultSchema]
	},
	lp : {
		type : Number,
		'default' : 0 
	},
	bestHighscore : {
		type : Number, 
		'default' : 0
	},
    fireBaseToken : {
		type : String,
		'default' : '',
	},
	carLevels : {
		type : [carLevel]
	},
	skillsStates : {
		type: [skillsState]
	}
});

// Validation method to make sure that the size stays under 1 mb
UserSchema.path('statistics').validate(bytes,
		'Uh oh, {PATH} memory size exceeds 1MB.');
function bytes(string) {
	var escaped_string = encodeURI(string);
	if (escaped_string.indexOf("%") != -1) {
		var count = escaped_string.split("%").length - 1;
		count = count == 0 ? 1 : count;
		count = count + (escaped_string.length - (count * 3));
	} else {
		count = escaped_string.length;
	}

	return count < 125000;
}

// // Bcrypt middleware on UserSchema
// UserSchema.pre('save', function(next) {
// 	/*var user = this;

// 	if (!user.isModified('password')) {
// 		return next();
// 	}*/

// 	/*bcrypt.genSaltAsync(10).then(function(salt) {
// 		return bcrypt.hashAsync(user.password, salt);
// 	}).then(function(hash) {
// 		user.password = hash;*/
// 	//}).nodeify(next);
//     console.log("UserSchema.pre('save', function(next");
//     return next();
// });

// Password verification
UserSchema.methods.comparePassword = function(password) {
	bcrypt.compareAsync(password, this.password);
};

UserSchema.methods.compareGuestPassword = function(password) {
    console.log("this.password: " + this.password);
	return password === this.password ? true : false;
};

UserSchema.methods.compareLavaSkullPassword = function(password) {
    console.log("this.password: " + this.password);
	return password === this.password ? true : false;
};

UserSchema.methods.registerGame = function( match ){
	
}

module.exports = mongoose.model('user', UserSchema);