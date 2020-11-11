var Promise = require('bluebird');
var LimitedItems = require('../models/limiteditem');
var notifications = require('./messages/notifications');
var errors = require('./messages/errors');
var Config = require('../../config');

var Limited = {

    //router.get('/limited/amount', limited.retreiveAmounts);
    //router.get('/limited/purchase', limited.purchase);
    
    retreiveItems: function(req, res){
        
        LimitedItems.find({}, function (err, docs) 
        {
            console.log("docs length: " + docs.length);
            var itemsArray = [];
            for(var i=0;i<docs.length;i++)
            {
                console.log("adding.." + docs[i]);
                itemsArray.push(docs[i]);
            }
            return res.status(200).json({items:itemsArray});
        });
    },
    
     purchaseItem: function(req, res)
     {     
        var itemName = req.body.item;
    
        console.log("purchaseItem: " + itemName);
    
        LimitedItems.findOneAndUpdate({ name: itemName }, {}, function(err, result)
        {
            if(err)
            {
                console.log("purchaseItem - item not found exiting early");
                return res.status(404).json(errors.userNotFoundError);
            }
            else
            {
                if(result.amount > 0)
                {
                    result.amount = result.amount - 1;
                    result.save();
                }
                console.log("purchaseItem - new amount is: " +  result.amount);
            }
        });
                                      
        LimitedItems.find({}, function (err, docs) 
        {
            console.log("docs length: " + docs.length);
            
            var itemsArray = [];
            for(var i=0;i<docs.length;i++)
            {
                var limitedItem = docs[i];
                
                if(itemName === limitedItem.name)
                {
                    if(limitedItem.amount > 0)
                    {
                        limitedItem.amount = limitedItem.amount - 1;
                    }
                }
                
                console.log("adding.." + limitedItem);
                itemsArray.push(limitedItem);
                
            }
            return res.status(200).json({items:itemsArray});
        });
    },
  };
  
  
  module.exports = Limited;