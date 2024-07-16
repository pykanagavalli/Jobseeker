const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blackListSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "Nodejsauth",
    },
  },
  { timestamps: true }
);
module.exports = blackListSchema;
