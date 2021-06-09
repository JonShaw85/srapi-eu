const goosepage = require('goosepage');
goosepage.defaults = {
	//itemsPerPage : 20,
	page : 0
};

const User = require('../models/user');
const methods = require('./methods/profile');
const errors = require('./messages/errors');
const notifications = require('./messages/notifications');
const leaderboard = require('./leaderboard') 
const Auth = require('./methods/auth')


var paths = {
    getSkillsLockState: function (req, res) {
        console.log(req + res);
        return res.status(200).send({})
        try {
            let username = req.body.username; 
            let skillKey = req.body.skillKey; 

            Auth.findUserByUsername(username).then((user) => {    	
			if(!user) {
				return res.status(500).send('User not found')
			}
            let skills = user.skillsStates				
            let isUnlocked = false;
            skills.forEach(skill => {
                if(skill.skillKey == skillKey) 
                {
                    isUnlocked = skill.unlocked
                    console.log("Skill Found  " + skillKey + isUnlocked)
                }
            });


                return res.status(200).send({})
            })
        }
        catch(e) {
            console.log("Caught error ---" + e)
			return res.status(500).send()
        }
    },
    SetSkillsLockState: function (req, res) {
        console.log(req.body.username)
        return res.status(200).send()
    }
};

module.exports = paths;