var iap = require('in-app-purchase');
var Auth = require('./methods/auth');
var Promise = require('bluebird');
var Unlockable = require('./unlockables');
var errors = require('./messages/errors');
var lodash = require('lodash');

iap.config({
    applePassword: '',
    googlePublicKeyStrSandBox: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnZnDrIT9tC7NRKppM8KvLPVeZuFPmoMSmAPpCa57huL1RjeuL583KNsW/C37Q71ItX1a35LvLhLw3wmXHv1XGnLQ+XLmA/UcfrO98k1vtrHEerRb2obA7Nb0RcdP5NFC2JeOzEle3Mdn3f/nlEube0pCuvAcLYor0uiMfkt3KneErYdtfBVclcICp6qaHLh4vjxCNNXNFCxnLlRyhkbz6XtLYuWIU2uipQyFzOwzl1CgEbek8hRFvdZn8UB/cZfeWZnmfsgEfcl8GKJXJkbrt5bPILj+hqlBnl/jCLXNM9vt5s8VctLXZbS0GHDQ2JtkBX3CgDUfaMbPUQjoAL6/hwIDAQAB',
    googlePublicKeyStrLive: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnZnDrIT9tC7NRKppM8KvLPVeZuFPmoMSmAPpCa57huL1RjeuL583KNsW/C37Q71ItX1a35LvLhLw3wmXHv1XGnLQ+XLmA/UcfrO98k1vtrHEerRb2obA7Nb0RcdP5NFC2JeOzEle3Mdn3f/nlEube0pCuvAcLYor0uiMfkt3KneErYdtfBVclcICp6qaHLh4vjxCNNXNFCxnLlRyhkbz6XtLYuWIU2uipQyFzOwzl1CgEbek8hRFvdZn8UB/cZfeWZnmfsgEfcl8GKJXJkbrt5bPILj+hqlBnl/jCLXNM9vt5s8VctLXZbS0GHDQ2JtkBX3CgDUfaMbPUQjoAL6/hwIDAQAB',
    test: true
})

iap.setup((error) => {
    if (error) {
      console.log('ERROR INITIALIZING IAP VALIDATOR', error)
    }
})

var getPurchaseTag = function(user, purchase){
    console.log("[getPurchaseTag]: " + "iap-" + purchase.transactionId);
    return "iap-" + purchase.transactionId;
  };
  
  var executePurchaseData = function(req, res, purchaseData){
      
      console.log("[executePurchaseData]: " + JSON.stringify(purchaseData));
      
      //Start request
      Auth.findUserById(req.decoded._id).then(function(user){
        //Validate receipt and find items
        return validateList(user, purchaseData);
      })
      .spread(function(user, items){
        //Unlock validated items
        var is_iap = true;
        var lockItems = false;
        return Unlockable.unlockItemList(user, items, is_iap, lockItems, true);
      })
      .then(function(data){
        //Return unlocked items and reward
        console.log("[executePurchaseData] returning data: " + JSON.stringify(data));
          
        return res.status(200).json(data);
      })
      .caught(function(error) {
        return res.status(error.code || 500).json(error);
      });
  }
  
  var validatePurchase = function(user, purchase){
  
    console.log("[validatePurchase]");
      
    return new Promise(function(resolve, reject){
      //Check user
      //TODO
      //return reject(errors.purchaseWrongUser);
  
      //Check date
      /*var purchase_time = Number(purchase.purchaseDateMs) || Number(purchase.purchaseTime) || 0;
      var current_time = Date.now();
      var day = 3600 * 1000 * 24;
      if(current_time > purchase_time + day){
          console.log("[validatePurchase] - errors.purchaseWrongDate");
        return reject(errors.purchaseWrongDate);
      }*/
  
      //Check quantity
      var quantity = Number(purchase.quantity) || 0;
      if(quantity < 1 || quantity > 10){
           console.log("[validatePurchase] - errors.purchaseWrongQuantity");
        return reject(errors.purchaseWrongQuantity);
      }
  
      return resolve(purchase);
    });
  };
  
  var validateList = function(user, purchase_list){
      
      console.log("[validateList]");
      
      return new Promise(function(resolve, reject){
        
        //ValidFate each item and add them to unlock list
        Promise.map(purchase_list, function(purchase){
            
            return validatePurchase(user, purchase).then(function(result){
              return result;
            }).caught(function(error){ /*Item is ignored */ });
  
        }).then(function(purch_list){
            return lodash.pull(purch_list, undefined)
        }).then(function(purch_list){
          
          console.log("[validateList] - purch_list: " + JSON.stringify(purch_list));
            
          var namelist = [];
          var quantitylist = [];
          var current_time = Date.now();
  
          purch_list.forEach(function(purchase){
            
          console.log("[validateList] -  purch_list.forEach(function(purchase) " + JSON.stringify(purchase));
  
            //Add to name list
            console.log("[validateList] -  namelist adding " + purchase.productId);
            console.log("[validateList] -  quantitylist adding " + purchase.quantity);  
            namelist.push(purchase.productId);
            quantitylist.push(purchase.quantity);
          });
  
          return Promise.resolve([namelist, quantitylist]);
        })
        .spread(function(namelist, quantities){
          return Unlockable.getItemList(namelist).then(function(items){
            
          console.log("[validateList] - items: " + JSON.stringify(items));
              
            //Add quantities
            for(var i=0; i<items.length; i++){
              for(var q=0; q<namelist.length && q<quantities.length; q++){
                if(items[i].Name == namelist[q]){
                  items[i].quantity = quantities[q];
                }
              } 
            }
  
            return Promise.resolve(items);
          });
        })
        .then(function(items){
          return resolve([user, items]);
        })
        .caught(function(error){ reject(error); });
  
      });
  };
  
  var validateRequest = function(req, res){
    console.log("[iap] - validateRequest");
    Auth.findUserById(req.decoded._id)
      .then((user) => {
  
        //Check that data is there
        if(!req.body.receipt){
          console.log("[iap] - validateRequest - !req.body.receipt - returning errors.invalidParams");
          return Promise.reject(errors.invalidParams);
        }
  
        var data = { Store: req.body.receipt.Store, Payload: req.body.receipt.Payload };
  
        if (data.Store) {
          iap.validate(data, (err, response) => {
            if (err) {
                console.log("[iap] - validateRequest - errors.purchaseInvalidReceipt");
              return Promise.reject(errors.purchaseInvalidReceipt);
            }
  
            if (iap.isValidated(response)) {
  
              var purchase_data = iap.getPurchaseData(response);
  
              if(purchase_data.length > 1000){
                console.log("[iap] - validateRequest - errors.purchaseTooBig");
                return Promise.reject(errors.purchaseTooBig);
              }
  
              executePurchaseData(req, res, purchase_data);
              return Promise.resolve();
            }
          });
        }
        else{
          console.log("[iap] - validateRequest - data.Store not valid");
          return Promise.reject(errors.invalidParams);
        }
      })
      .caught(function(error){ res.status(error.code || 500).json(error); });
  }
  
  var test = function(req, res){
    var purchase_data = req.body.purchase;
    executePurchaseData(req, res, purchase_data);
  };
  
  module.exports = { validateRequest, test }
