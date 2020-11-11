var _ = require('lodash');
var Promise = require('bluebird');
var Match = require('./match');

// Game Type
function GameType(teamSize, gameType) {
    console.log("[GameType] - creating game type: " + gameType);
	this.queue = [];
	this.openMatches = [];
	this.closedMatches = [];
	this.teamSize = teamSize;
	this.gameType = gameType;
	this.iter = 0;
}
GameType.prototype.createTeamMatch = function(players){
    console.log("[GameType] - createTeamMatch");
	var teamMatch = new Match(players[0])
	teamMatch.teamSize = this.getTeamSize()
	teamMatch.gameType = this.toString()
	this.openMatches.push(teamMatch);
    console.log("[GameType] - createTeamMatch - pushing match into openmatches " + JSON.stringify(teamMatch));
	teamMatch.joinAsTeam(players);
}

GameType.prototype.createThreeVThreeMatch = function(players) {
	console.log("[GameType] - createThreeVThree team match");
	
	var teamMatch = new Match(players[0])
	teamMatch.teamSize = this.getTeamSize()
	teamMatch.gameType = this.toString()

	players.forEach(player => {
		teamMatch.join(player)
	});

	teamMatch.start();
	this.closedMatches.push(teamMatch)
	return teamMatch;
}

GameType.prototype.getTeamSize = function() {
	return this.teamSize;
}
GameType.prototype.join = function(user) {
	console.log("[GameType] - join - user: " + user.username);
    
    if (this.queue.indexOf(user) != -1) 
    {
//console.log("[GameType] - join - exitinng early as user is already in the queue: " + user.username);
        return;
    }
    
    var usr = user.toObject();
	usr.jointime = Date.now();
	this.queue.push(usr);
}
GameType.prototype.leave = function(user) {
    console.log("[GameType] - leave - user: " + user.username);
	if (this.queue.indexOf(user) != -1) {
		this.queue.splice(this.queue.indexOf(user), 1);
	}
}
GameType.prototype.toString = function() {
	return this.gameType;
}

GameType.prototype.status = function() {
	return "[Gametype] status - : " + this.gameType + ", Queue: " + this.queue.length
			+ ", Open Matches: " + this.openMatches.length
			+ ", Closed Matches: " + this.closedMatches.length + ".";
}

GameType.prototype.getNumInQueue = function() {
    var numInOpenMatches = 0;
    for (var i = 0; i < this.openMatches.length; i++)
    {
        var openMatch = this.openMatches[i];
        numInOpenMatches += openMatch.teams[0].length + openMatch.teams[1].length;
    }
    
    return this.queue.length + numInOpenMatches;
}

// Run through the queue; prune expired players
GameType.prototype.pruneQueue = function() {
    
}

GameType.prototype.pruneOpenMatches = function() {
   
}

GameType.prototype.pruneClosedMatches = function(){

    var _closedMatches = this.closedMatches
	return Promise.map(_closedMatches, function(match){
		if(match && (Date.now() > match.expiry  ))
		{
			match.complete(0); //close match with default team one
            //console.log("[GameType] pruneClosedMatches - removing match " + match);
            _.remove(_closedMatches, match);
		}
	})
}

GameType.prototype.GetMatchForApproxElo = function(selectedUser, threshold, index) {
	 //console.log("[GameType] - GetMatchForApproxElo");
    var closestMatch = this.openMatches.reduce(function(prev, curr) {
		return (Math.abs(curr.elo - selectedUser.elo) < Math.abs(prev.elo
				- selectedUser.elo) ? curr : prev);
	});
    
    //console.log("[GetMatchForApproxElo] - Closest match: "+ JSON.stringify(closestMatch));
    
	// Does the closest match found meet the threshold?
	if (Math.abs(closestMatch.elo - selectedUser.elo) <= threshold) {
		var matchobj = {
			idx : index,
			selectedMatch : closestMatch
		}
        //console.log("[GameType] GetMatchForApproxElo - Found match " + JSON.stringify(matchobj));
		return matchobj;
	}
	// no match found
	return null;
}

GameType.prototype.GetPlayerForApproxElo = function(index, threshold) {
	 //console.log("[GameType] - GetMatchForApproxElo");
    for (var j = index + 1; j < this.queue.length; j++) {
		var policyvalue = Math.abs(this.queue[j].elo
				- this.queue[index].elo);
        
        var id0 = this.queue[index]._id.toString();
        var id1 = this.queue[j]._id.toString();
        
        //console.log("[GetPlayerForApproxElo] - policyvalue: "+ JSON.stringify(policyvalue));
		if (policyvalue <= threshold && id0 != id1) {
            
            //console.log("[GetPlayerForApproxElo] - returning match object for : "+ JSON.stringify(this.queue[index]));
            
			var matchobj = {
				idx : [ index, j ],
				selectedMatch : undefined
			}
			return matchobj;
		}
	}

	return null
}

GameType.prototype.CombineOpenMatches = function(selectedUser, threshold, index) {

    try{
		//console.log("[GameType] - CombineOpenMatches : " + this.gameType);
		if (this.openMatches.length === 0)
		{
			//console.log("[GameType] - CombineOpenMatches exiting early as openMatches.length === 0 : " + this.gameType);
			return null;
		}
		
		var prev = this.openMatches[0];
		for (var i = 1; i < this.openMatches.length; i++)
		{
			var curr = this.openMatches[i];

			//console.log("[CombineOpenMatches] prev.teams[0].length: " + prev.teams[0].length);
			//console.log("[CombineOpenMatches] prev.teams[1].length: " + prev.teams[1].length);
			//console.log("[CombineOpenMatches] curr.teams[0].length: " + curr.teams[0].length);
			//console.log("[CombineOpenMatches] curr.teams[1].length: " + curr.teams[1].length);
			//console.log("this.teamSize: " + this.teamSize);
			
			/*if ((prev.teams[0].length === 0 || prev.teams[1].length === 0) &&
			(curr.teams[0].length === 0 || curr.teams[1].length === 0) &&
			(prev.teams[0].length+prev.teams[1].length + curr.teams[0].length+curr.teams[1].length) === (this.teamSize+this.teamSize)) {
		*/   
		
			if((prev.teams[0].length+prev.teams[1].length + curr.teams[0].length+curr.teams[1].length) === (this.teamSize+this.teamSize)) {

				var prevTeams = [];
				var currTeams = [];
			
				if(prev.teams[0].length != 0)
				{
					for (var i = 0; i < prev.teams[0].length; i++)
					{
					prevTeams.push(prev.teams[0][i]);
					}
				}
				if(prev.teams[1].length != 0)
				{
					for (var i = 0; i < prev.teams[1].length; i++)
					{
					prevTeams.push(prev.teams[1][i]);
					}
				}
				if(curr.teams[0].length != 0)
				{
					for (var i = 0; i < curr.teams[0].length; i++)
					{
					currTeams.push(curr.teams[0][i]);
					}
				}
				if(curr.teams[1].length != 0)
				{
					for (var i = 0; i < curr.teams[1].length; i++)
					{
					currTeams.push(curr.teams[1][i]);
					}
				}
				
				/*if (curr.teams[0].length === 0)
					curr.teams[0] = (prev.teams[0].length != 0) ? prev.teams[0] : prev.teams[1];
				else
					curr.teams[1] = (prev.teams[0].length != 0) ? prev.teams[0] : prev.teams[1];*/

				_.remove(this.openMatches, function(obj) {
					return obj === prev;
				});	

				// move match to closed list and start it
				_.remove(this.openMatches, function(obj) {
					return obj === curr;
				});
				
				curr.teams[0].length = 0;
				curr.teams[1].length = 0;
				
				if(prevTeams.length != 0)
				{
					for (var i = 0; i < prevTeams.length; i++)
					{
					curr.teams[0].push(prevTeams[i]);
					}
				}
				
				if(currTeams.length != 0)
				{
					for (var i = 0; i < currTeams.length; i++)
					{
					curr.teams[1].push(currTeams[i]);
					}
				}
				
				// move it to the closed list
				this.closedMatches.push(curr);
				console.log("[GameType] CombineOpenMatches -moving to closed list: match " + curr);
				// start the match
				curr.start();		
				break;
			}		
		}
	}
	catch(e){
		console.log('[Combine Open Matches Error] : ' + e)
	}
}

GameType.prototype.ProcessQueue = function(settings) {
	try{
		// Process x players per process Tick
	// Only if there are enough players/matches
    //console.log("[ProcessQueue] - this.openMatches.length: " + this.openMatches.length);
    //console.log("[ProcessQueue] - this.queue.length: " + this.queue.length);
    //console.log("[ProcessQueue] - this.closedMatches.length: " + this.closedMatches.length);
    
	var match;
    if(this.queue.length == 0 && this.openMatches.length > 0)
    {
        // Check to see if we can combine open matches to create a closed match
		this.CombineOpenMatches();
    }
    
    while (this.queue.length > 0 && this.iter < settings.maxiters) {
	//while (((this.openMatches.length > 0 && this.queue.length > 0) || this.queue.length >= 2 || this.openMatches.length >= 2)
	//		&& this.iter < settings.maxiters) {

		// Check to see if we can combine open matches to create a closed match
		this.CombineOpenMatches();

		for (var i = 0; i < this.queue.length; i++) {
			var selectedUser = this.queue[i];

			//Find threshold increase
			var offset = 0;
			if(selectedUser.jointime){
				var current_time = Date.now();
				var time_waiting = (current_time - selectedUser.jointime) / 1000; //In sec
				var time_step = Math.floor(time_waiting / 5);
				offset = Math.max(time_step * settings.threshold_increase, 0);
			}

			// Check if a game exists that is open and has matching elo
			if (this.openMatches.length > 0) 
            {
                //console.log("Attempting to find GetMatchForApproxElo..settings.threshold: " + settings.threshold + ", offset: " + offset);
                
				match = this.GetMatchForApproxElo(selectedUser,settings.threshold + offset, i)
                if(match)
                {
                    // console.log("[ProcessQueue] - GetMatchForApproxElo found match!");
                }
			}
            //Blah
			// If no match, find a player to start a match with
			if (!match)
            {
               // console.log("Attempting to find GetPlayerForApproxElo..settings.threshold: " + settings.threshold + ", offset: " + offset);
                
				match = this.GetPlayerForApproxElo(i, settings.threshold + offset)
                if(match)
                {
                    // console.log("[ProcessQueue] - GetPlayerForApproxElo found match!");
                }
            }
				// Break the loop if we found a match
			if (match)
            {
               // console.log("[GameType] - ProcessQueue - found a match - break the loop - " +  JSON.stringify(match));
				break
            }
		}
		//TODO optimise this; method is to long
		// Process the collection and match
		if (match) {
			var players = [];
			// If no game exists
			if (!match.selectedMatch) {
				// get the players involved and remove them from the queue
                var p0 = this.queue.splice(match.idx[0], 1).pop();
                var p1 = this.queue.splice(match.idx[1] - 1, 1).pop();
                
                var id0 = p0.toString();
                var id1 = p1.toString();  
                
             //   console.log("[GameType] ProcessQueue p0._id: " + id0);
             //   console.log("[GameType] ProcessQueue p1._id: " + id1);
                
                /*if(id0 == id1)
                {
                     console.log("[GameType] ProcessQueue ALARM!! - trying to create a match with duplicate players!");
                }
                else
                {*/
                    players.push(p0);
                    players.push(p1);

        //            console.log("[GameType] ProcessQueue adding players: " + JSON.stringify(players));

                    match.selectedMatch = new Match(players[0]);
                    match.selectedMatch.teamSize = this.getTeamSize();
                    match.selectedMatch.gameType = this.toString();
        //            console.log("[GameType] ProcessQueue - creating Match: " + match.selectedMatch + " for player: " + players[0]);
                    //console.log("[GameType] ProcessQueue - pushing to openmatches");
                    // and the new match to the openlist
                    this.openMatches.push(match.selectedMatch);
                //}
               
                
			} else {
				players.push(this.queue.splice(match.idx, 1).pop());
			    //.log("[GameType] Match already exists - adding player - players = : " + JSON.stringify(players));
            }

			// join the match
			for (var i = 0; i < players.length; i++) {
				match.selectedMatch.join(players[i]);
			}
              
            //console.log("[GameType] ProcessQueue - Can we start the game?");
			// See if we can start the game
			if (match.selectedMatch && match.selectedMatch.evaluate()) {
				// move match to closed list and start it
				_.remove(this.openMatches, function(obj) {
					return obj === match.selectedMatch;
				});
                 console.log("[GameType] ProcessQueue - moving match: " + match.selectedMatch + " to closed list and starting...");
				// move it to the closed list
				this.closedMatches.push(match.selectedMatch);
				// start the match
				match.selectedMatch.start();
			}
		}

		this.iter++;
	}

	this.iter = 0;
	}
	catch(e){
		console.log('[Process Queue Error] : ' + e)
	}
}

module.exports = exports = GameType;