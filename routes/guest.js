const express = require("express");
const router = express.Router();
const Guest = require("../models/Guest");
const Family = require("../models/Family");

require("dotenv").config();

/*Add a new guest*/
router.post("/guest", async (req, res) => {
  try {
    const { firstName, lastName, plusOne, family } = req.body;

    if (!firstName || !lastName) {
      return res
        .status(409)
        .json({ message: "Veuillez remplir tous les champs" });
    }

    const verifyGuest = await Guest.findOne({
      firstName: firstName,
      lastName: lastName,
    });

    if (verifyGuest) {
      return res.status(400).json({ message: "Invité déjà dans la liste" });
    }

    const newGuest = new Guest({
      firstName: firstName.toLowerCase(),
      lastName: lastName.toLowerCase(),
      plusOne: plusOne,
      family: family,
    });

    await newGuest.save();

    if (family) {
      const familyMember = await Family.findById(family);
      const members = [...familyMember.members, newGuest._id];
      familyMember.members = members;

      await familyMember.save();
    }

    return res.status(200).json("invité ajouté");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/*Afficher un invité*/
router.get("/guest", async (req, res) => {
  try {
    const { firstName, lastName } = req.query;

    if (!firstName || !lastName) {
      return res
        .status(409)
        .json({ message: "veuillez remplir tous les champs" });
    }

    const guestToDisplay = await Guest.findOne({
      firstName: firstName,
      lastName: lastName,
    }).populate("family");

    if (!guestToDisplay) {
      return res.status(400).json({ message: "Invité non trouvé" });
    }

    return res.status(200).json(guestToDisplay);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/*Afficher une famille */
router.get("/family-member", async (req, res) => {
  try {
    const familyId = req.query.familyId;
    const familyMembers = await Guest.find({ family: familyId });
    console.log(familyMembers);

    return res.status(200).json(familyMembers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/*Modifier les infos d'un invité */
router.put("/guest", async (req, res) => {
  try {
    const { firstName, lastName, mealChoice, allergies, isComing } = req.body;

    if (!firstName || !lastName) {
      return res
        .status(409)
        .json({ message: "Veuillez remplir tous les champs" });
    }

    const guestToDisplay = await Guest.findOne({
      firstName: firstName,
      lastName: lastName,
    });

    if (mealChoice) {
      guestToDisplay.mealChoice = mealChoice;
    }
    if (allergies) {
      guestToDisplay.allergies = allergies;
    }
    guestToDisplay.isComing = isComing;
    await guestToDisplay.save();
    return res.status(200).json(guestToDisplay);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/*Afficher les invités */
router.get("/guests", async (req, res) => {
  try {
    const allGuest = await Guest.find();
    return res.status(200).json(allGuest);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/*Ajouter un plus one */
router.post("/plusOne", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      firstName_plusOne,
      lastName_plusOne,
      allergies_plusOne,
    } = req.body;

    // Trouver l'invité
    const guestToDisplay = await Guest.findOne({
      firstName: firstName,
      lastName: lastName,
    });

    if (!guestToDisplay) {
      return res.status(404).json({ error: "Invité introuvable" });
    }

    if (!guestToDisplay.plusOne) {
      return res
        .status(400)
        .json({ error: "Plus-one déjà utilisé pour cet invité." });
    }

    // Ajouter une nouvelle famille si nécessaire
    const newFamily = new Family({
      family_name: guestToDisplay.lastName,
      members: [guestToDisplay._id],
    });
    await newFamily.save();

    // Mettre à jour la famille de l'invité initial
    guestToDisplay.family = newFamily._id;
    guestToDisplay.plusOne = false;
    await guestToDisplay.save();

    // Ajouter le plus-one comme un nouvel invité
    if (!firstName || !lastName || !firstName_plusOne || !lastName_plusOne) {
      return res
        .status(409)
        .json({ message: "veuillez remplir tous les champs" });
    }

    const newGuest = new Guest({
      firstName: firstName_plusOne,
      lastName: lastName_plusOne,
      allergies: allergies_plusOne,
      family: newFamily._id,
      plusOneOf: `${lastName} ${firstName}`,
    });
    await newGuest.save();

    // Mettre à jour les membres de la famille
    newFamily.members.push(newGuest._id);
    await newFamily.save();

    return res
      .status(201)
      .json({ message: "Plus-one ajouté avec succès", guest: newGuest });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
