const { Schema } = require("mongoose")

const userSchema = new Schema({
    userName: { type: String, min: 3},
    companyName: { type: String, min: 3 },
    businessNumber:{type:Number,min:10},
    businessEmail:{type:String,min:10},
    address:{type:String},
    password: { type: String, min: 8},
    email: { type: String },
    phone: { type:Number},
    registerType: { type:String},
},
    { timestamp: true }
)

module.exports = userSchema