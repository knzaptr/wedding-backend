const mongoose = require("mongoose");

const Family = mongoose.model("Family", {
  family_name: String,
  members: Array,
});

module.exports = Family;
