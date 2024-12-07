const express = require("express");
const router = express.Router();
const Guest = require("../models/Guest");
const Family = require("../models/Family");

require("dotenv").config();

/*Add a new guest*/
router.post("/guest", async (req, res) => {
  try {
    const { first_name, last_name, plus_one, family } = req.body;

    if (!first_name || !last_name) {
      return res
        .status(409)
        .json({ message: "Veuillez remplir tous les champs" });
    }

    const verifyGuest = await Guest.findOne({
      first_name: first_name,
      last_name: last_name,
    });

    if (verifyGuest) {
      return res.status(400).json({ message: "Invité déjà dans la liste" });
    }

    const newGuest = new Guest({
      first_name: first_name,
      last_name: last_name,
      plus_one: plus_one,
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

/*Afficher un invité (et sa famille) */
router.get("/guest", async (req, res) => {
  try {
    const { first_name, last_name } = req.body;

    if (!first_name || !last_name) {
      return res
        .status(409)
        .json({ message: "veuillez remplir tous les champs" });
    }

    const guestToDisplay = await Guest.findOne({
      first_name: first_name,
      last_name: last_name,
    }).populate("family");

    if (!guestToDisplay) {
      return res.status(400).json({ message: "Invité non trouvé" });
    }

    return res.status(200).json(guestToDisplay);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/*Modifier les infos d'un invité */
router.put("/guest", async (req, res) => {
  try {
    const { first_name, last_name, meal_choice, allergies } = req.body;

    if (!first_name || !last_name || !meal_choice) {
      return res
        .status(409)
        .json({ message: "Veuillez remplir tous les champs" });
    }

    const guestToDisplay = await Guest.findOne({
      first_name: first_name,
      last_name: last_name,
    });

    guestToDisplay.meal_choice = meal_choice;
    guestToDisplay.allergies = allergies;
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
router.post("/plus_one", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      first_name_plus_one,
      last_name_plus_one,
      meal_choice_plus_one,
      allergies_plus_one,
    } = req.body;

    // Trouver l'invité
    const guestToDisplay = await Guest.findOne({
      first_name: first_name,
      last_name: last_name,
    });

    if (!guestToDisplay) {
      return res.status(404).json({ error: "Invité introuvable" });
    }

    if (!guestToDisplay.plus_one) {
      return res
        .status(400)
        .json({ error: "Plus-one déjà utilisé pour cet invité." });
    }

    // Ajouter une nouvelle famille si nécessaire
    const newFamily = new Family({
      family_name: guestToDisplay.last_name,
      members: [guestToDisplay._id],
    });
    await newFamily.save();

    // Mettre à jour la famille de l'invité initial
    guestToDisplay.family = newFamily._id;
    guestToDisplay.plus_one = false;
    await guestToDisplay.save();

    // Ajouter le plus-one comme un nouvel invité
    if (
      !first_name ||
      !last_name ||
      !first_name_plus_one ||
      !last_name_plus_one ||
      !meal_choice_plus_one
    ) {
      return res
        .status(409)
        .json({ message: "veuillez remplir tous les champs" });
    }

    const newGuest = new Guest({
      first_name: first_name_plus_one,
      last_name: last_name_plus_one,
      meal_choice: meal_choice_plus_one,
      allergies: allergies_plus_one,
      family: newFamily._id,
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
