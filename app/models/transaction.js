const Promise = require('bluebird')
const mongoose = require('mongoose')

mongoose.Promise = Promise

const transactionSchema = new mongoose.Schema({

    userid : {
		type : String,
		required : true,
	},
	timestamp :
	{
		type : Date,
	},
	currency : {
		type : String
	},
	type : {
		type : String
	},
	amount : {
		type : Number
    }
    
})

module.exports = mongoose.model('transaction', transactionSchema)