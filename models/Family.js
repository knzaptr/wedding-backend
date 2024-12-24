const mongoose = require("mongoose");

const Family = mongoose.model("Family", {
  familyName: String,
  members: Array,
});

module.exports = Family;
