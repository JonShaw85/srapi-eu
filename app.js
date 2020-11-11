const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser')
const Auth = require('./app/controllers/methods/auth');
const Promise = require('bluebird');
const unlockables = require('./app/controllers/unlockables')
const config = require('./config');
const leaderboard = require('./app/controllers/leaderboard')

require('./db/db') //require the database to call the code on it, which will connect to the database

const port = process.env.PORT || 8081 //Either use the environments port, or 8081
console.log('Server port is: ' + port)

//Define paths for express config 
//const publicDir = path.join(__dirname, '/public')

//Set up a static directory to serve to the browser
//app.use(express.static(publicDir))

//Set up app.use functionsw
app.use(express.json())
app.use(bodyParser.urlencoded({ extended : true}))
//app.use(bodyParser.json)
app.use(function (err, req, res, next) {
  return res.status(err.status || 500).json({
    message: err.message,
    error: {}
  })
})

// app.get('', (req, res) => {
//   res.json({Main : "Main Page"})
// })

const routePath = path.join(__dirname, '/app/routes/index.js')
const mainRouter = require(routePath)
app.use('/api', mainRouter)

//TODO find better way for caching results
app.set('etag', false);

//Handle email confirmation page
app.get('/confirmation', (req, res) => {

  var promise = new Promise(function(resolve, reject) 
    {
       //console.log("Auth: ", Auth);
      Auth.confirmEmailAddress(req.query.id).then(function(user)
      {
         //console.log("[confirmation] user not found!");
          if(!user)
          {
                //console.log("[confirmation] user not found!");
                return reject(errors.userNotFoundError);
          }
          else
          {
                //console.log("[confirmation] user found!"); 
          }
          
        }).caught(function(error){ reject(error); });
     });
     return res.redirect('https://www.lavaskull.com/email-verification');
})

app.post('/api/items/fill', unlockables.fill_item_list)

// app.post('/api/items/fill', (req, res) => {
//   console.log('DOIN A REQUEST')
//   return res.status(200).send('fetching items')
// })



//Tell the app to start listening on the set port for requests
app.listen(port, () => {
  console.log('Server started on port ' + port)
})