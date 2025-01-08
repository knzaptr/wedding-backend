const express = require("express");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const router = express.Router();
const Admin = require("../models/Admin");

/* Sign Up */
router.post("/backoffice/signup", async (req, res) => {
  try {
    if (!req.body.password) {
      return res.status(400).json({ message: "Missing parameter 😗" });
    }

    const password = req.body.password;
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(64);

    const adminLogin = await Admin.find();

    //Un seul mot de passe maximum enregistré
    if (adminLogin.length === 1) {
      return res.status(400).json({ message: "Password already resgister" });
    }

    const newAdmin = new Admin({
      token: token,
      hash: hash,
      salt: salt,
    });

    await newAdmin.save();

    return res.status(201).json(newAdmin);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/* Log In */
router.post("/backoffice/login", async (req, res) => {
  try {
    if (!req.body.password) {
      return res.status(400).json({ message: "Missing parameter 😗" });
    }

    const adminLogin = await Admin.findOne();

    if (!adminLogin) {
      return res.status(418).json({
        message: "No password register 🤔 ",
      });
    } else {
      const hashToCompare = SHA256(
        req.body.password + adminLogin.salt
      ).toString(encBase64);
      if (hashToCompare !== adminLogin.hash) {
        return res.status(409).json({ message: "Incorrect password" });
      } else {
        return res.status(200).json({
          token: adminLogin.token,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

/* Update password */
router.put("/backoffice/update-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Missing parameter 😗" });
    }

    const adminLogin = await Admin.findOne();

    if (!adminLogin) {
      return res.status(400).json({ message: "No password register" });
    } else {
      const hashToCompare = SHA256(currentPassword + adminLogin.salt).toString(
        encBase64
      );
      if (hashToCompare !== adminLogin.hash) {
        return res.status(400).json({ message: "Incorrect password" });
      } else if (currentPassword === newPassword) {
        return res.status(400).json({
          message: "Current password and new password have to be different !",
        });
      } else {
        const salt = uid2(16);
        const hash = SHA256(newPassword + salt).toString(encBase64);
        const token = uid2(64);

        adminLogin.token = token;
        adminLogin.hash = hash;
        adminLogin.salt = salt;

        await adminLogin.save();
        return res.status(200).json({ token: adminLogin.token });
      }
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
