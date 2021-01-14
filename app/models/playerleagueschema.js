const promise = require('bluebird')
const mongoose = require('mongoose')

mongoose.Promise = promise

const leaguePlayerSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    elo: {
        type: Number,
        required: true,
        min: 0
    },
    lp: {
        type: Number,
        required: true,
        min: 0
    },
    eloReward: {
        type: Number,
        required: true
    },
    xpReward: {
        type: Number
    },
    srdReward: {
        type: Number
    },
    ownsLpBoost: {
        type: Boolean,
        'default': false,
        required: true
    },
    ownsLpShield: {
        type: Boolean,
        'default': false,
        required: true
    },
    onWinStreak: {
        type: Boolean,
        'default': false,
        required: true
    },
    currentPosition: {
        type: Number,
        'default': 101,
        required: true
    },
    lastPosition: {
        type: Number,
        'default': 101,
        required: true
    }
})

const leagueSchema = new mongoose.Schema({
    league_id: {
        type: String,
        required: true
    },
    players: [leaguePlayerSchema],
    hasExpired: {
        type: Boolean,
        'default': false
    },
    numPlayers: {
        type: Number,
        required: true
    },
    creationTime: {
        type: Date
    },
    expiryTime: {
        type: Date
    },
    devLeague: {
        type: Boolean,
        'default': false,
        required: true
    }
})

module.exports = mongoose.model('playerleague', leagueSchema)