const mongoose = require("mongoose");

const Admin = mongoose.model("Admin", {
  token: String,
  hash: String,
  salt: String,
});

module.exports = Admin;
