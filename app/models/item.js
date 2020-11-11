const Promise = require('bluebird')
const mongoose = require('mongoose')

mongoose.Promise = Promise

const itemSchema = new mongoose.Schema({

    Name : {
		type : String,
		required : true,
	},
	BitIndex : {
		type : Number,
		required : true,
		min : 0
	},
	SRDCost : {
		type : Number,
		required : true,
		'default' : 0,
		min : 0
	},
	SRDReward : {
		type : Number,
		'default' : 0,
		min : 0
	},
	FuelReward : {
		type : Number,
		'default' : 0,
		min : 0
	},
	BitPackage : {
		type : [Number]
    }
})

module.exports = mongoose.model('item', itemSchema)