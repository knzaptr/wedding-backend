const mongoose = require("mongoose");

const Guest = mongoose.model("Guest", {
  firstName: String,
  lastName: String,
  isComing: Boolean,
  mealChoice: String,
  allergies: Array,
  plusOne: { type: Boolean, default: false },
  plusOneOf: String,
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Family",
  },
});

module.exports = Guest;
