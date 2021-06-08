
const User = require('../models/user');
const Auth = require('./methods/auth')


var paths = {
    GetSkillsLockState: function (req, res) {
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

module.exports = paths;