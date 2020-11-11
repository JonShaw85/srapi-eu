const goosepage = require('goosepage')
const schedule = require('node-schedule')
const fs = require('fs')
const User = require('../models/user')

goosepage.defaults = {
    itemsPerPage: 100,
    page: 0
}

var writeLeaderboard = function() {
    try {
        console.log('Leaderboard :: Updating')
        goosepage(User.find().sort({'elo' : -1}).select(
            'id username elo'
        )).then((result) => {
            console.log('Leaderboard :: Update complete, saving to file')
            var data = JSON.stringify(result)
            fs.writeFileSync(__dirname + '/leaderboard.json', data)
        })
    } catch (e) {
        console.log('Leaderboard :: ERROR writing leaderboard: ' + e)
    }
}


////////////// WORKING BUT DISABLED FOR PERFORMANCE //////////////////

// try {
//     //Call to do the first write of the leaderboard, and then schedule it to run every hour
//     writeLeaderboard()
//     schedule.scheduleJob('* * /1 * * *', writeLeaderboard())

// } catch (e) {
//     console.log('Leaderboard :: ERROR scheduling job: ' + e)
// }

////////////////////////////////////////////////////////////////////

var paths = {

    readLeaderboard : function(req, res){
        var highscore = req.body.isHighscore
        var isHighscore = (highscore == "True")
        
        try {
            if(isHighscore) {
                console.log('Leaderboard :: Getting highscore leaderboard')
                goosepage(User.find().sort({'bestHighscore' : -1}).select(
                    'id username elo bestHighscore'
                ), {itemsPerPage : 100, page : 0}).then((result) => {
                    var data = JSON.stringify(result)
                    return res.status(200).json(result)
                })
            } else {
                console.log('Leaderboard :: Getting elo leaderboard')
                goosepage(User.find().sort({'elo' : -1}).select(
                    'id username elo bestHighscore'
                ), {itemsPerPage : 100, page : 0}).then((result) => {
                    var data = JSON.stringify(result)
                    return res.status(200).json(result)
                })
            }
        } catch (e) {
            console.log('Leaderboard :: ERROR writing leaderboard: ' + e)
            return res.status(400).json(result)
        }
    },
}



module.exports = paths