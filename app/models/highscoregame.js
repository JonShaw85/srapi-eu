const Promise = require('bluebird')
const mongoose = require('mongoose')

mongoose.Promise = Promise

const highscorecardsSchema = new mongoose.Schema({

	card_id: {
		type: Number,
		'default': -1,
		required: true,
	}
})

const highscoreplayerSchema = new mongoose.Schema({

	user_id: {
		type: String,
		required: true,
	},
	score: {
		type: Number,
		required: true,
	},
	elo: {
		type: Number,
		required: true,
	},
	currentPosition: {
		type: Number,
		required: true,
		"default": 13
	},
	lastPosition: {
		type: Number,
		required: true,
		"default": 13
	},
	canBeNotified: {
		type: Boolean,
		"default": true
	},
	cards: [highscorecardsSchema],
})


const highscoregameSchema = new mongoose.Schema({

	game_id: {
		type: String,
		required: true,
	},
	arena: {
		type: Number,
		required: true,
	},
	players: [highscoreplayerSchema],
	hasExpired: {
		type: Boolean,
		'default': false,
	},
	numPlayers: {
		type: Number,
		required: true,
		'default': 0,
		min: 0
	},
	timestamp:
	{
		type: Date,
	}
})

module.exports = mongoose.model('highscoregame', highscoregameSchema)