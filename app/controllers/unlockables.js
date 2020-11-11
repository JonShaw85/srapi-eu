var Promise = require('bluebird');
var Auth = require('./methods/auth');
var Config = require('../../config');
var User = require('./../models/user');
var Item = require('./../models/item');
var lodash = require('lodash');
var errors = require('./messages/errors');
var Convert = require('./methods/convert');
var ProfileMethods = require('./../controllers/methods/profile');
var crypto = require('crypto');

var Unlockable = {

    //Get list of all unlocked items
    getUnlockedItems: function(req, res){
  
      console.log("[Unlockables - getUnlockedItems]");
        
      var FindItemList = function(user){
        return new Promise(function(resolve, reject){
          
          Item.find({}).sort({"BitIndex" : 1}).exec(function(err, items) {
  
            //Find the unlocked items
            var unlocked = [];
            items.forEach(function(item){
              if(Unlockable.isItemUnlocked(user, item)){
                unlocked.push(item);
              }
            });
  
            resolve(unlocked);
          });
        });
      }
  
      Auth.findUserById(req.decoded._id)
      .then(FindItemList)
      .then(function(data){
        return  res.status(200).json(data);
      })
      .caught(function(error) {
        return res.status(error.code || 500).json(error);
      });
  
    },
  
    getAllItems: function(req, res){
  
      console.log("[Unlockables - getAllItems]...");
        
      var FindItemList = function(user){
        return new Promise(function(resolve, reject){
          Item.find({}).sort({"BitIndex" : 1}).exec(function(err, items) {
             return resolve(items);
          });
        });
      }
  
      Auth.findUserById(req.decoded._id)
      .then(FindItemList)
      .then(function(data){
        return  res.status(200).json(data);
      })
      .caught(function(error) {
        return res.status(error.code || 500).json(error);
      });
    },
  
    //Unlock item with SRD
    unlockItems: function(req, res){
  
      console.log("[Unlockables - unlockItems]...");
        
      var UnlockList = function(user, items){
  
        //Prevent from unlocking free items (these are for IAP or video watch)
        var unlock_items = [];
        items.forEach(function(item){
          var srd_cost = Number(item.SRDCost) || 0;
          if(srd_cost > 0){
            unlock_items.push(item);
          }
        });
        
        //Unlock the list
        var is_free = false;
        var lockItems = false;
        return Unlockable.unlockItemList(user, unlock_items, is_free, lockItems, false);
      }
  
      var namelist = req.body.items || [];
  
      //Start request
      Promise.join(Auth.findUserById(req.decoded._id), Unlockable.getItemList(namelist), UnlockList)
      .then(function(data){
        return  res.status(200).json(data);
      })
      .caught(function(error) {
        return res.status(error.code || 500).json(error);
      });
    },
  
    //Lock previously unlocked items
    lockItems: function(req, res){
  
      console.log("[Unlockables - lockItems]...");
        
      var LockList = function(user, items){
  
        var lockItems = true;
        var is_free = false;
        return Unlockable.unlockItemList(user, items, is_free, lockItems, false);
      }
  
      var namelist = req.body.items || [];
  
      //Start request
      Promise.join(Auth.findUserById(req.decoded._id), Unlockable.getItemList(namelist), LockList)
      .then(function(data){
        return  res.status(200).json(data);
      })
      .caught(function(error) {
        return res.status(error.code || 500).json(error);
      });
    },
  
    validate_item : function(item){
      return (item.Name && item.BitIndex != undefined && item.SRDCost != undefined);
    },
  
    //Fill items in DB
    fill_item_list : function(req, res){
      
      console.log("[Unlockables - fill_item_list]...");
       
      var items = req.body.items;
      console.log('Filling in items ' + JSON.stringify(items))

      Item.insertMany(items)
      .then(function(results) {
           return res.status(200).json(results);
      })
      .catch(function(error) {
          console.log('Error inserting documents ' + error.message);
          return res.status(500).send(error.message);
      });
    },
  
    //Unlock item via video watch callback
    unlockItemVideo: function(req, res){
  
      console.log("[Unlockables - unlockItemVideo]...");
     
      //Check if we have all params
      if(req.query.applicationUserId == undefined || req.query.rewards == undefined || req.query.eventId == undefined 
        || req.query.custom_item == undefined || req.query.signature == undefined || req.query.timestamp == undefined){
          var error = errors.invalidParams;
          return res.status(error.code || 500).json(error);
      }
  
      var user_id = decodeURIComponent(req.query.applicationUserId);
      var item_name = decodeURIComponent(req.query.custom_item);
  
      var GetList = function(user){
  
        //Check signature
        var server_secret = req.query.timestamp + req.query.eventId 
          + user_id + req.query.rewards + Config.iron_source_key;
        var server_sign = crypto.createHash('md5').update(server_secret).digest("hex");
        
        if (server_sign != req.query.signature)
        {
          return Promise.reject(errors.wrongSignature);
        }
  
        //Check user
        if(user == null){
          return Promise.reject(errors.userNotFoundError);
        }
        
        //Unlock the list
        var items = [item_name];
        return Unlockable.getItemList(items);
      }
  
      var UnlockList = function(items){
        return Auth.findUserById(user_id).then(function(user){
          var is_free = true;
          var lockItems = false;
          return Unlockable.unlockItemList(user, items, is_free, lockItems, false);
        }).catch((e) => {
          return res.status(e.code).send('[Unlock List] Error: ' + e);
        });
      }
  
      //Start request
      Auth.findUserById(user_id)
      .then(GetList)
      .then(UnlockList)
      .then(function(data){
        var res_data = req.query.eventId + ":OK";
        return  res.status(200).send(res_data);
      })
      .caught(function(error) {
        return res.status(error.code || 500).json(error);
      });
    },
  
    //Unlock item via video watch callback
    unlockDailyRewardCar: function(req, res)
    {
        console.log("[Unlockables - unlockDailyRewardCar]...");
     
        var item_name = req.body.car;
          
        //Start request
        Auth.findUserById(req.decoded._id)
        .then(function(user)
        {
            var items = [item_name];
            return Unlockable.unlockItemList(user, items, true, false, false);
        })
        .then(function(data)
        {
              const notification   =  notifications.dailyRewardResponse;
              notification.unlock  =  item_name;
              return res.status(200).json(notification);
        })
        .caught(function(error) 
        {
            return res.status(error.code || 500).json(error);
        });
    },
    
    //Unlock item via video watch callback
    unlockItemReward: function(req, res){
  
       console.log("[Unlockables - unlockItemReward]...");
     
      var item_name = req.body.item_name;
        
      //Check if we have all params
      if(typeof item_name != "string"){
          var error = errors.invalidParams;
          return res.status(error.code || 500).json(error);
      }
  
      var GetList = function(user){
  
        //Check user
        if(user == null){
          return Promise.reject(errors.userNotFoundError);
        }
  
        //Find matches played in last 48 hours
        return ProfileMethods.getMatchesPlayedLast48(req.decoded._id).then(function(match_data)
        {  
              var match48_count = match_data.match_count;

              //Make sure we have requirements for the reward
              var is_valid = false;
              var found = false;
            
              var items=[];
            
              Config.rewards_data.forEach(function(reward_data)
              {
                    if(reward_data.item_name == item_name)
                    {
                          var required_goals = reward_data.goals || 0;
                          var required_matches = reward_data.matches || 0;
                          var required_matches48 = reward_data.matches_last_48 || 0;
                          var required_wins = reward_data.wins || 0;
                          found = true;

                          console.log('[Unlockables] User claiming rewards is : ' + JSON.stringify(user)); 

                          if(user.goals >= required_goals && user.wins >= required_wins
                            && user.matches >= required_matches && match48_count >= required_matches48)
                          {

                              //Reset db
                              user.goals = (required_goals > 0) ? 0 : user.goals;
                              user.matches = (required_matches > 0) ? 0 : user.matches;
                              user.wins = (required_wins > 0) ? 0 : user.wins;
                              user.save();
                              
                              console.log('[unlockItemReward] User has achieved ' + item_name);
                              
                              //var items=[item_name];
                              //return Unlockable.getItemList(items);
                              items.push(item_name);
                          }
                          else
                          {
                              console.log('[unlockItemReward] User has not achieved ' + item_name); 
                          }
                    }
              });
            
            
             return Unlockable.getItemList(items);
          
        }).catch((e) => {
          return res.status(e.code || 500).send('[Unlockables] Error Caught: ' + e);
        });
      }
  
      var UnlockList = function(items){
        console.log('[unlockItemReward] [UnlockList] ' + JSON.stringify(items)); 
        return Auth.findUserById(req.decoded._id).then(function(user){
          var is_free = true;
          var lockItems = false;
          return Unlockable.unlockItemList(user, items, is_free, lockItems, false);
        });
      }
  
      //Start request
      Auth.findUserById(req.decoded._id)
      .then(GetList)
      .then(UnlockList)
      .then(function(data)
      {
         if(data == undefined || data.items == null || data.items.length == 0)
         {
             return  res.status(400).json(errors.rewardRequirementsUnmet);
         }
         return  res.status(200).json(data);
      })
      .caught(function(error) {
        return res.status(error.code || 500).json(error);
      });
    },
  
    countRewards: function(req, res){
  
      console.log("[Unlockables - countRewards]...");
     
      Promise.join(Auth.findUserById(req.decoded._id), 
        ProfileMethods.getMatchesPlayedLast48(req.decoded._id), 
        function(user, match_data){
        
        var match48_count = match_data.match_count;
        
        return new Promise(function(resolve, reject){
          //Count number of avail rewards
          var count = 0;
          
          Promise.map(Config.rewards_data, function(reward_data){
            var required_goals = reward_data.goals || 0;
            var required_matches = reward_data.matches || 0;
            var required_matches48 = reward_data.matches_last_48 || 0;
            var required_wins = reward_data.wins || 0;
  
            //Reward completed
            if(user.goals >= required_goals && user.wins >= required_wins
              && user.matches >= required_matches && match48_count >= required_matches48)
            {
                return Unlockable.getItemByName(reward_data.item_name).then(function(item){
                  console.log("countRewards: reward completed: " + reward_data.item_name);
                  return reward_data.item_name;
                });
            }
          })
          .then(function(items){
            return lodash.pull(items, undefined);
          })
          .then(function(items){
            Auth.findUserById(req.decoded._id).then(function(user){
              resolve({
                "username": user.username,
                "count": items.length, 
                "matches": user.matches,
                "goals": user.goals,
                "wins": user.wins,
                "matches48": match48_count
              });
            });
          })
          .caught(function(error){ reject(error); })
        });
        
      })
      .then(function(data){
          console.log("countRewards: returning.: " + JSON.stringify(data));
        return  res.status(200).json(data);
      })
      .caught(function(error) {
          console.log("countRewards - error: " + JSON.stringify(error));
        return res.status(error.code || 500).json(error);
      });
    },
  
    test_add_match: function(req, res){
      ProfileMethods.getMatchesPlayedLast48(req.decoded._id).then(function(match_values){
        match_values.match_count+=5;
        return res.status(200).json(match_values);
      });
    },
  
    ///------
  
    //From an array of item names, return list of items
    getItemList: function(namelist){
      
        console.log("[Unlockables - getItemList]..." + namelist);
     
        return new Promise(function(resolve, reject){
          
        if(!namelist){
          console.log("[getItemList]: exiting early: invalidParams");
          return reject(errors.invalidParams);
        }
  
        if(namelist.constructor !== Array){
          console.log("[getItemList]: exiting early: namelist is not an array");
          return reject(errors.invalidParamsValues);
        }
  
        //Get items in the list
        Item.find({
            "Name": { $in: namelist }
        }, function(err, items_data){
  
          if(err){
              console.log("[getItemList]: exiting early: item not found");
            return reject(errors.itemNotFound);
          }
  
          //Convert to javascript object
          var items = items_data.map(function(doc) { return doc.toObject(); });
          resolve(items);
        });
      });
    },
  
    isItemUnlocked: function(user, item){
  
      console.log("[Unlockables - isItemUnlocked] item.. " + JSON.stringify(item));
        
      var unlockString = Convert.hexToBinary(user.unlockedItems || "");
      if(item && item.BitIndex && unlockString.length > item.BitIndex){
        if(unlockString.charAt(item.BitIndex) == '1'){
          return true;
        }
      }
      return false;
  
    },
  
    unlockItemList: async function(user, items, free, lock, isIAPPurchase){
        
      console.log("[Unlockables - unlockItemList]");
        
      if(items != undefined)
        console.log("Unlockables - unlockItemList] - items: " + JSON.stringify(items));
      
      //console.trace("[Unlock item list] TRACE");

      return new Promise(function(resolve, reject){
  
        if(items.constructor !== Array){
          console.log("[Unlockables - unlockItemList] errors.invalidParamsValues");
          return reject(errors.invalidParamsValues);
        }
        
        User.findOne({_id: user._id}, async function(err, userf){
  
          if(err){
            console.log("[Unlockables - unlockItemList] errors.userNotFoundError");
            return reject(errors.userNotFoundError);
          }
  
          var unlockString = Convert.hexToBinary(userf.unlockedItems || "");
          var rewards = {items: [], srd_earned: 0, fuel_earned: 0, total_cost: 0, success: false};
          
          //initialize
          if(unlockString.length == 0){
            var zero = "0";
            unlockString = zero.repeat(512);
            var hexString = Convert.binaryToHex(unlockString);
            userf.unlockedItems = hexString;
            console.log("[Unlockables - unlockItemList] setting userf.unlockedItems to " + hexString);
          }
  
          
          if(lock){
              console.log("[Unlockables - unlockItemList] locking..");
            //Lock items
            items.forEach(function(item){
              if(Unlockable.isItemUnlocked(userf, item)){
                Unlockable.lockOneItem(userf, item, rewards);
              }
            });
          }
          else{
             console.log("[Unlockables - unlockItemList] unlocking..");
            //unlock each item
            items.forEach(function(item){
              var srd_cost = Number(item.SRDCost) || 0;
               console.log("[Unlockables - unlockItemList] isIAPPurchase: " + isIAPPurchase + " , srd_cost: " + srd_cost + " , user has " + userf.srd + " srd");
              if(isIAPPurchase || srd_cost <= userf.srd){
                if(isIAPPurchase || !Unlockable.isItemUnlocked(userf, item)){
                  Unlockable.unlockOneItem(userf, item, rewards, free);
                }
              }
            });
          }
  
          //Save user
          await userf.save();
          rewards.success = true;
           console.log("[Unlockables - unlockItemList] success resolving rewards.." + JSON.stringify(rewards));
          resolve(rewards);
        });
      });
    },
  
    //To be called from unlockItemList only (no DB load/save here)
    unlockOneItem: function(user, item, rewards, free){  
  
      if(!user || !item){
        console.log("[Unlockables - unlockOneItem] exiting early as user or item is null");
        return;
      }
  
      console.log("Unlock: " + item.Name + " (" + user.username + ")");
  
      var unlockString = Convert.hexToBinary(user.unlockedItems);
      var quantity = Number(item.quantity) || 1;
      
      //Switch bit
      var replaceAt = function(str, index, replacement) {
          return str.substr(0, index) + replacement+ str.substr(index + replacement.length);
      }
      unlockString = replaceAt(unlockString, item.BitIndex, "1");
      rewards.items.push(item.Name);
  
      //Unlock pack
      if(item.BitPackage){
        item.BitPackage.forEach(function(subitembit){
          console.log("[unlockOneItem] setting unlock bit...");
          unlockString = replaceAt(unlockString, subitembit, "1");
        });
      }
  
      //Pay SRD cost (except bought with real money in an IAP, or unlocked as reward)
      var is_free = free || false;
      if(!is_free && item.SRDCost){
        var srd_cost = Number(item.SRDCost) || 0;
        user.srd -= srd_cost * quantity;
        rewards.total_cost += srd_cost * quantity;
      }
  
      //Give reward
      if(item.SRDReward){
        var srd_reward = Number(item.SRDReward) || 0;
        user.srd += srd_reward * quantity;
        rewards.srd_earned += srd_reward * quantity;
      }
  
      if(item.FuelReward){
        var fuel_reward = Number(item.FuelReward) || 0;
        user.fuel += fuel_reward * quantity;
        user.fuel = Math.min(user.fuel, Config.max_fuel);
        rewards.fuel_earned += fuel_reward * quantity;
      }
  
      var hexString = Convert.binaryToHex(unlockString);
      user.unlockedItems = hexString;
  
    },
    
    getUnlockBinaryString: function(req, res){
      try{
        console.log("Getting unlock string from server"); 
        var username = req.body.username; 
        var unlockString = ""; 
        
        if(username){

          Auth.findUserByUsername(username).then((user) => {

            if(user){
              unlockString = Convert.hexToBinary(user.unlockedItems);
            }
          }).then(() => {
            return res.status(200).json({"unlocks" : unlockString})
          })
        }
      } catch (e) {
        return res.status(400).send(e); 
      }
    },

    devUnlockMiddleware: function(req, res){

      var devUnlockItem = function(username, itemBitIndex) {

        console.log("Unlock Dev: Username is : " + username + " bitIndex is: " + itemBitIndex); 
  
        Auth.findUserByUsername(username).then((user) => {
  
          if(user){
            console.log("Unlock: Dev is unlocking item for player: " + user); 
  
            var unlockString = Convert.hexToBinary(user.unlockedItems); 
  
            var replaceAt = function(str, index, replacement) {
              return str.substr(0, index) + replacement+ str.substr(index + replacement.length);
            }
            unlockString = replaceAt(unlockString, itemBitIndex, "1");
            var hexString = Convert.binaryToHex(unlockString); 
            user.unlockedItems = hexString; 
            user.save(); 
          }
  
        }).catch((e) => {
          console.log("Unlock Error: " + e)
        })
      }


      try{
        console.log("Dev unlock middleware request: " + req.body); 
      
        var username = req.body.username; 
        var bitIndex = Number(req.body.itemBitIndex);

        console.log("Dev unlock item for : " + username + " : " + bitIndex); 

        if(username && bitIndex){
          devUnlockItem(username, bitIndex);
          return res.status(200).json({"Success" : "true"}); 
        }

      } catch(e) {
        console.log("Dev unlock error: " + e); 
        return res.status(400).json({"Error" : e});
      }
    },
  
    //Not an actual feature, but may be useful to fix mistakes
    lockOneItem: function(user, item, rewards){
  
      console.log("[Unlockables- lockOneItem] Locking.. " + item.Name + " (" + user.username + ")");
  
      var unlockString = Convert.hexToBinary(user.unlockedItems);
  
      //Switch bit
      var replaceAt = function(str, index, replacement) {
          return str.substr(0, index) + replacement+ str.substr(index + replacement.length);
      }
      unlockString = replaceAt(unlockString, item.BitIndex, "0");
      rewards.items.push(item.Name);
  
      var hexString = Convert.binaryToHex(unlockString);
      user.unlockedItems = hexString;
    },
  
    getItemByBit: function(bitIndex){
  
      return new Promise(function(resolve, reject){
        Item.findOne({BitIndex: bitIndex}, function(err, item){
          if(err){
            reject(errors.itemNotFound);
          }else{
            resolve(item);
          }
        });
      });
    },
  
    getItemByName: function(itemName){
      return new Promise(function(resolve, reject){
        Item.findOne({Name: itemName}, function(err, item){
          if(err){
            reject(errors.itemNotFound);
          }else{
            resolve(item);
          }
        });
      });
    },
  
  
  };
  
  
  module.exports = Unlockable;