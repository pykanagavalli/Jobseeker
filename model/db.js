const mongoose = require("mongoose");
const userSchema = require("../schema/user");
const blackListSchema = require("../schema/blacklist");
const db = {};
var prefix_Name = "Nodejs";
db.mongoose = mongoose;
db.user = mongoose.model(prefix_Name + "auth", userSchema);
db.blacklist = mongoose.model(prefix_Name+"blacklist",blackListSchema)

module.exports = db;
