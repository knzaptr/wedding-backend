const mongoose = require("mongoose");

const Guest = mongoose.model("Guest", {
  firstName: String,
  lastName: String,
  isComing: { type: Boolean, default: false },
  mealChoice: String,
  allergies: { type: String, default: "None" },
  plusOne: { type: Boolean, default: false },
  plusOneOf: String,
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Family",
  },
});

module.exports = Guest;
