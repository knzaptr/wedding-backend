const mongoose = require("mongoose");

const Guest = mongoose.model("Guest", {
  first_name: String,
  last_name: String,
  meal_choice: String,
  allergies: Array,
  plus_one: { type: Boolean, default: false },
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Family",
  },
});

module.exports = Guest;
