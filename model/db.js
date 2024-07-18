const mongoose = require("mongoose");
const userSchema = require("../schema/user");
const blackListSchema = require("../schema/blacklist");
const businessSchema = require('../schema/business');

const db = {};
var prefix_Name = "Nodejs";
db.mongoose = mongoose;
db.user = mongoose.model(prefix_Name + "auth", userSchema);
db.blacklist = mongoose.model(prefix_Name+"blacklist",blackListSchema)
db.business = mongoose.model(prefix_Name + "business",businessSchema)

module.exports = db;
