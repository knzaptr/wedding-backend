const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const familyRouter = require("./routes/family");
const guestRouter = require("./routes/guest");
const adminRouter = require("./routes/admin");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(familyRouter);
app.use(guestRouter);
app.use(adminRouter);

mongoose.connect(process.env.MONGODB);

app.get("/", (req, res) => {
  try {
    return res.status(200).json({ message: "Hello World!" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Pour les routes inconnues
app.all("*", (req, res) => {
  return res.status(404).json({ error: "This route does not exist 🤔" });
});

app.listen(process.env.PORT || 3001, () => {
  console.log("Server started 🚀");
});
