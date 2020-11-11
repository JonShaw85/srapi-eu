const Promise = require('bluebird')
const mongoose = require('mongoose')

mongoose.Promise = Promise

const limiteditemSchema = new mongoose.Schema({

    name : {
		type : String,
		required : true,
	},
	amount : {
		type : Number,
		required : true,
		min : 0
	}
})

module.exports = mongoose.model('limiteditem', limiteditemSchema)