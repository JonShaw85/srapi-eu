var Promise = require('bluebird');
var Auth = require('./methods/auth');
var User = require('./../models/user');
var Unlockable = require('./unlockables');
var errors = require('./messages/errors');
var Config = require('../../config');
var notifications = require('./messages/notifications');

var Currency = {

    getSRD: function(req, res){
        Auth.findUserById(req.decoded._id).then(function(user) {
          //console.log("[Currency] - getSRD - srd: " + user.srd + ", fuel: " + user.fuel);
          return res.status(200).json({srd: user.srd, fuel: user.fuel});
        }).caught(function(error) {
          return res.status(error.code).json(error);
        });
    },
    
     getXP: function(req, res){
        Auth.findUserById(req.decoded._id).then(function(user) {
          return res.status(200).json({xp: user.xp});
        }).caught(function(error) {
          return res.status(error.code).json(error);
        });
    },
  
    removeSRD: function(req, res)
    {
      var username = req.body.username
      var SRD = req.body.srd
      var SRDNumber = Number(SRD)
      Auth.findUserByUsername(username).then((user) => {
       if(user)
       {
          user.srd -= SRDNumber
          return res.status(200).json({srd:SRD})
       }
       else
       {
         return res.status(500).send("Failed to remove SRD");
       }
      })
    },

    refillFuel: function(req, res){
      //Removing fuel in future update
    },
  
    addMultiplier: function(req, res){
  
      //console.log("[addMultiplier]");   
      var mult = req.body.multiplier || 2;
      mult = Math.min(Math.max(mult, 0), 4);
  
      Currency.multNextSRD(req, req.decoded._id, mult)
      .then(function(multi){
        //console.log("[Currency] - addMultiplier: " + multi);
        return res.status(200).json({_id: req.decoded._id, success: true, multiplier: multi});
      })
      .caught(function(error) {
          return res.status(error.code).json(error);
      });
  
    },
  
    //Add multiplier via video watch callback
    addMultiplierVideo: function(req, res){
  
      //console.log("[addMultiplierVideo]"); 
        
      //Check if we have all params
      if(req.query.applicationUserId == undefined || req.query.rewards == undefined || req.query.eventId == undefined){
          var error = errors.invalidParams;
          return res.status(error.code || 500).json(error);
      }
  
      var user_id = decodeURI(req.query.applicationUserId);
      var mult = 2;
  
      Currency.multNextSRD(req, user_id, mult)
      .then(function(multi){
        var res_data = req.query.eventId + ":OK";
        //console.log("[Currency] - addMultiplierVideo: " + res_data);
        return res.status(200).send(res_data);
      })
      .caught(function(error) {
          return res.status(error.code).json(error);
      });
  
    },
  
    watchFuelVideo : function(req, res){
        
      //console.log("[watchFuelVideo]"); 
        
         Auth.findUserById(req.decoded._id).then(function(user) {
          //console.log("[Currency] - watchFuelVideo - oldfuel: " + user.fuel);
          user.fuel = Config.max_fuel;
          //console.log("[Currency] - watchFuelVideo - newfuel: " + user.fuel);
          return Currency.updateFuel(user.id, user.fuel);
         }).then(function(user) {
          return res.status(200).json({srd: user.srd, fuel: user.fuel});
        }).caught(function(error) {
          return res.status(error.code).json(error);
        });
        /*
          Auth.findUserById(req.decoded._id).then(function(user) {
         
          console.log("[Currency] - watchFuelVideo - oldfuel: " + user.fuel);
          user.fuel = user.fuel + 1;
          console.log("[Currency] - watchFuelVideo - newfuel: " + user.fuel);
              
            Currency.updateFuel(req.decoded._id, user.fuel).then(function(){
              return res.status(200).json({
                fuel: user.fuel
              });
            }).caught(function(error) {
              return res.status(error.code).json(error);
            });
              
          return res.status(200).json({fuel: user.fuel});
        }).caught(function(error) {
          return res.status(error.code).json(error);
        });  
      });*/
    }, 
      
    addXPForVideo : function(req, res) 
    {
        console.log("addXPForVideo");

        Auth.findUserById(req.decoded._id).then(function(user) 
        {
            if(!user)
            {
                console.log("addXPForVideo - user not found");
                return res.status(404).json(errors.userNotFoundError);
            }
            else
            {
                console.log("addXPForVideo - user found: " + user.username);
            }
            
            var amountToInc     = Math.round(Number(req.body.xp) || 0);
            
            console.log("addXPForVideo - Amount to increase is: " + amountToInc);

            var userCurrentXP   = Number(user.xp);
            console.log("addXPForVideo - Current user xp is: " + userCurrentXP);
            
            var finalUserXP      = (userCurrentXP + amountToInc);
            console.log("addXPForVideo - Final user XP will be: " + finalUserXP);

            user.xp              =  finalUserXP;

            const notification   =  notifications.xpinc;
            notification.xp      =  user.xp;
            
            user.save();
            
            console.log("debugAddXP - success! sending back user.." + user.username + ".. XP added: " + amountToInc + " Final xp is: " + user.xp);

            return res.status(200).json(notification);

        }).caught(function(error) 
        {
          return res.status(error.code).json(error);
        });
    },
    
    addDailyRewardBonus : function(req, res) 
    {
        console.log("addDailyRewardBonus");

        Auth.findUserById(req.decoded._id).then(function(user) 
        {
            if(!user)
            {
                console.log("addDailyRewardBonus - user not found");
                return res.status(404).json(errors.userNotFoundError);
            }
            else
            {
                console.log("addDailyRewardBonus - user found: " + user.username);
            }
            
            var xpInc           = Math.round(Number(req.body.xp) || 0);
            var srdInc          = Math.round(Number(req.body.srd) || 0);
            
            console.log("addDailyRewardBonus - xpInc: " + xpInc + " , srdInc: " + srdInc);

            var userCurrentXP   = Number(user.xp);
            //console.log("addDailyRewardBonus - Current user xp is: " + userCurrentXP);
            
            var userCurrentSRD  = Number(user.srd);
            //console.log("addDailyRewardBonus - Current user xp is: " + userCurrentXP);
            
            var finalUserXP      = (userCurrentXP + xpInc);
            //console.log("addDailyRewardBonus - Final user XP will be: " + finalUserXP);
            
            var finalUserSRD     = (userCurrentSRD + srdInc);
            //console.log("addDailyRewardBonus - Final user XP will be: " + finalUserXP);

            user.xp              =  finalUserXP;
            user.srd             =  finalUserSRD;

            const notification   =  notifications.dailyRewardResponse;
            notification.xp      =  user.xp;
            notification.srd     =  user.srd;
            
            user.save();

            return res.status(200).json(notification);

        }).caught(function(error) 
        {
          return res.status(error.code).json(error);
        });
    },
    
    payFuel : function(user_id){
      //Removing fuel in future update
    },
  
    test: function(req, res){
        var srd = Math.round(Number(req.body.srd) || 0); 
  
        /*Currency.gainSRD(req.decoded._id, srd)
        .then(function(result){
          return res.status(200).json({_id: result._id, username: result.username, srd: result.srd, fuel: result.fuel});
        })
        .caught(function(error) {
          console.log(error)
          return res.status(error.code).json(error);
        });*/
      
        Currency.payFuel(req.decoded._id).then(function(result){
          return res.status(200).json({_id: result._id, username: result.username, srd: result.srd, fuel: result.fuel});
        }).caught(function(error){
          return res.status(error.code).json(error);
        });
    },
  
    //For wawtching video, multiply next SRD gain
    multNextSRD: function(req, user_id, multiplier){
       //console.log("[multNextSRD]"); 
      return new Promise(function(resolve, reject) {
        Auth.findUserById(user_id).then(function(user) {
          if(!user){
            return reject(errors.userNotFoundError);
          }
          resolve(multiplier);
        });
      });
    },
  
    updateFuel : function(user_id, fuel){
  
        //console.log("Currency: updateFuel");
        
        return new Promise(function(resolve, reject) {
  
          if(fuel < 0){
            return reject(errors.invalidParamsValues);
          }
  
          User.findOneAndUpdate({ _id: user_id }, {fuel: fuel}, {}, function(err, result){
            if(err){
              reject(errors.userNotFoundError);
            }
            else{
              //console.log("Currency: updateFuel - from " + result.fuel + " to " + fuel);  
              result.fuel = fuel;
              resolve(result);
            }
          });
        });
    },
  
    updateSRD : function(user_id, srd){
        //console.log("[updateSRD]"); 
        return new Promise(function(resolve, reject) {
  
          if(srd < 0){
            return reject(errors.invalidParamsValues);
          }
  
          User.findOneAndUpdate({ _id: user_id }, {srd: srd}, {}, function(err, result){
            if(err){
              reject(errors.userNotFoundError);
            }
            else{
              result.srd = srd;
              resolve(result);
            }
          });
        });
    },
    
    updateXP : function(user_id, xp){
        
        return new Promise(function(resolve, reject) {
  
          if(xp < 0){
            return reject(errors.invalidParamsValues);
          }
  
          User.findOneAndUpdate({ _id: user_id }, {xp: xp}, {}, function(err, result){
            if(err){
              reject(errors.userNotFoundError);
            }
            else{
              result.xp = xp;
              resolve(result);
            }
          });
        });
    },
  
    gainSRD : function(user_id, srd){

      return new Promise(function(resolve, reject) {
  
        Auth.findUserById(user_id).then(function(user) 
        {
          if(!user)
          {
            return reject(errors.userNotFoundError);
          }
            
          var srd_value = user.srd + srd; 
          
            resolve([user_id, srd_value]);
            
        });
          
      }).spread(Currency.updateSRD);
    },
    
    gainXP : function(user_id, xp){

      return new Promise(function(resolve, reject) {
  
        Auth.findUserById(user_id).then(function(user) 
        {
          if(!user)
          {
            return reject(errors.userNotFoundError);
          }
            
          var xp_value = user.xp + xp; 
          
            resolve([user_id, xp_value]);
            
        });
          
      }).spread(Currency.updateXP);
    },

    resetxpandunlocks : function(req, res) {
    
        console.log("resetxpandunlocks");
        
        Auth.findUserById(req.decoded._id).then(function(user) 
        {
            if(!user)
            {
                console.log("resetxpandunlocks - user not found");
                return res.status(404).json(errors.userNotFoundError);
            }
            else
            {
                console.log("resetxpandunlocks - user found: " + user.username);
            }
            
            user.xp             = 0;
            user.unlockedItems  = "";
    
            user.save();
            
            const notification   = notifications.xpreset;
            notification.user    = user;
    
            console.log("resetxpandunlocks - success! sending back user.." + user.username);
            
			return res.status(200).json(notification);
    
        }).caught(function(error) 
        {
          return res.status(error.code).json(error);
        });
    },
    
    debugAddXP : function(req, res) 
    {
        console.log("debugAddXP");

        Auth.findUserById(req.decoded._id).then(function(user) 
        {
            if(!user)
            {
                console.log("debugAddXP - user not found");
                return res.status(404).json(errors.userNotFoundError);
            }
            else
            {
                console.log("debugAddXP - user found: " + user.username);
            }

            var amountToInc      =  1000;

            user.xp              =  user.xp + amountToInc;

            const notification   =  notifications.xpinc;
            notification.xp      =  user.xp;
            
            user.save();
            
            console.log("debugAddXP - success! sending back user.." + user.username);

            return res.status(200).json(notification);

        }).caught(function(error) 
        {
          return res.status(error.code).json(error);
        });
    },
    
    fakeonlineusefuel : function(req, res) 
    {
        console.log("fakeonlineusefuel");

        Auth.findUserById(req.decoded._id).then(function(user) 
        {
            if(!user)
            {
                console.log("fakeonlineusefuel - user not found");
                return res.status(404).json(errors.userNotFoundError);
            }
            else
            {
                console.log("fakeonlineusefuel - user found: " + user.username);
            }

            var newfuel           =  user.fuel - 1;

            if(newfuel < 0){

              console.log("fakeonlineusefuel - Attempted to set fuel less than 0, resetting it to 0");
              newfuel = 0; 
              
            }

            user.fuel            =  Math.min(newfuel,Config.max_fuel);

            const notification   =  notifications.fakeonlineusefuel;
            notification.fuel    =  user.fuel;
            
            user.save();
            
            return res.status(200).json(notification);

        }).caught(function(error) 
        {
          return res.status(error.code).json(error);
        });
    }

  };
  
  
  module.exports = Currency;