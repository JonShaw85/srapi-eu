////*** Using this file to connect to the mongoose database, this is called in app.js, using 'require(<this script>)' ***/////
///*** MONGOOSE ***///

const mongoose = require('mongoose')
const mongooseURI = 'mongodb+srv://lavaskull:ChrissyChris1@cluster0-zdyjg.mongodb.net/test?retryWrites=true&w=majority'

//Connect to the mongo database using the connection string
const mongo = mongoose.connect(mongooseURI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
})

//Called when we connect to the database
mongoose.connection.on('connected', () => {
    console.log('Mongoose default connection open to ' + mongooseURI);
})

//Called if the connection throws an error
mongoose.connection.on('error', (err) => {
    console.log('Mongoose default connection error: ' + err);
})

//Called when the connection is disconnected
mongoose.connection.on('disconnected', () => {
    console.log('Mongoose default connection disconnected'); 
})

//If the node process ends, close the mongoose connection
process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console.log('Mongoose default connection disconnected through app termination'); 
	    process.exit(0); 
    })
})



///// EXPORTS ///// 
module.exports.mongo = mongo
