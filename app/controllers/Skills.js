
const User = require('../models/user');
const methods = require('./methods/profile');
const errors = require('./messages/errors');
const notifications = require('./messages/notifications');
const leaderboard = require('./leaderboard')
const Auth = require('./methods/auth')


var paths = {
    getSkillsLockState: function (req, res) {
        try {
            let username = req.body.username; 
            Auth.findUserByUsername(username).then((user) => {
            

            
            })
        }
        catch(e) {
            console.log("Caught error ---" + e)
			return res.status(500).send()
        }
    },
    setSkillsLockState: function (req, res) {
        try {
            let username = req.body.username; 
            Auth.findUserByUsername(username).then((user) => {
            
                
                return res.status(200).send({})
            })
        }
        catch(e) {
            console.log("Caught error ---" + e)
			return res.status(500).send()
        }
    }
}