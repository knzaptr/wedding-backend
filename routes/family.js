const express = require("express");
const router = express.Router();
const Family = require("../models/Family");

require("dotenv").config();

/*Add a new family*/
router.post("/family", async (req, res) => {
  try {
    const { familyName, members } = req.body;
    const newFamily = new Family({
      familyName: familyName,
      members: members,
    });

    await newFamily.save();
    return res.status(200).json(newFamily);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
