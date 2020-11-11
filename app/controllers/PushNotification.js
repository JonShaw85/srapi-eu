var FireBase = require("../../adminsdk.json");
var admin = require("firebase-admin");
//var RegToken = "fcOeU_xDQ9C42HtqmHDJ4R:APA91bG3QaVgR-z3xyubDeCPvgXpi_wbShy67PCUfEP60X8AEvAYTD2z5NRJcvM4vsW4mgkIoK8UL33IAs9_MZb5qdaeDnnFbtWqIITupB8yVJ_PNV13-SzVhc3bLL-242quCyjqootz";
var RegToken = "";  
var Auth = require('./methods/auth');

var Notifications = {
    FireBaseInit : function(){
        admin.initializeApp({
            credential: admin.credential.cert(FireBase),
            databaseURL: "<your database URL here>"
          });         
    },
    SetFireBaseID : function(req, res){
        var Token = req.body.FireBaseToken
        var UserName = req.body.UserName
        Auth.findUserByUsername(UserName).then((user)=>{
        if(user)
        {
            user.fireBaseToken = Token
            user.save()
            return res.status(200).send()
            
        }
        else
        {
            return res.status(400).send()
           
        }
        })
    },
    TestNotie : function(req, res) {       
        var TextTitle = req.body.NotificationTitle 
        var payload = {
            notification: {
              title: TextTitle,
              body: ""
            }
          };
        
          var options = {
            priority: "high",
            timeToLive: 60 * 60 *24
          };
        
          admin.messaging().sendToDevice(RegToken, payload, options)
          .then(function(response) {
            console.log("Successfully sent message:", response);
          })
          .catch(function(error) {
            console.log("Error sending message:", error);
          });
    },
    SendNotification : function(UserName, BeatenByUserName, Score){
      Auth.findUserByUsername(UserName).then((user)=>{
        if(user)
        {
          var TextTitle = BeatenByUserName + " HAS BEATEN YOUR HIGHSCORE WITH " + Score
          var payload = {
              notification: {
                title: "",
              body: TextTitle
              }
            };
          
            var options = {
              priority: "high",
              timeToLive: 60 * 60 *24
            };
            console.log("NOTIFICATION TOKEN " + user.fireBaseToken);
          if(user.fireBaseToken != undefined && user.fireBaseToken != "")
          {
            admin.messaging().sendToDevice(user.fireBaseToken, payload, options)
            .then(function(response) {
              console.log("Successfully sent message:", response);
            })
            .catch(function(error) {
              console.log("Error sending message:", error);
            });
          }
          else
          {
            console.log("NOTIFICATION NOT SENT ");
          } 
            
        }
      })
    }
}
module.exports = Notifications