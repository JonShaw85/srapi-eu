var _ = require('lodash');
var Elo = require('arpad');
var elo = new Elo();
var uuid = require('node-uuid');
var Promise = require('bluebird');
var User = require('./../models/user');
var Currency = require('./../controllers/currency');
var Config = require('../../config');
var Unlockable = require('./../controllers/unlockables');

// Match properties
var Match = function(owner) {
	this.id = uuid.v4(); // Id of the match
    //console.log("[Match] - new match created with id: " + this.id + " , owner = " + owner);
    //console.trace();
	this.owner = owner; // Owner of the match
	this.elo = owner.elo;
	this.teams = [ [], [] ];
	this.score = [];
}
Match.prototype.expiry = new Date();
Match.prototype.teamSize = 1;
Match.prototype.gameType = '';
Match.prototype.complete = function(team) {
};
Match.prototype.evaluate = function() {
};
Match.prototype.start = function() {
}

Match.prototype.join = function(user) {
};

Match.prototype.joinAsTeam = function(players) {
};

// Remove user from the teams
Match.prototype.leave = function(currentUser, updateElo) {
}
// calculate the average elo for this game
Match.prototype.calculateElo = function() {
}

Match.prototype.pruneExpiredPlayers = function() {
}




module.exports = exports = Match;