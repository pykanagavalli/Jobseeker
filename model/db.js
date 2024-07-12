const mongoose = require("mongoose");
const userSchema = require("../schema/user");
const db = {};
var prefix_Name = "Nodejs";
db.mongoose = mongoose;
db.user = mongoose.model(prefix_Name + "auth", userSchema);

module.exports = db;
