const mongoose = require("mongoose");

const blackListSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      ref: user,
    },
  },
  { timestamps: true }
);
module.exports=blackListSchema