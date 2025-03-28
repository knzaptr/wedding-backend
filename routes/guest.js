const express = require("express");
const router = express.Router();
const Guest = require("../models/Guest");
const Family = require("../models/Family");
const isAdmin = require("../middleware/isAdmin");

require("dotenv").config();

/*Add a new guest*/
router.post("/guest", async (req, res) => {
  try {
    const { firstName, lastName, plusOne, family } = req.body;

    if (!firstName.toLowerCase() || !lastName.toLowerCase()) {
      return res
        .status(409)
        .json({ message: "Veuillez remplir tous les champs" });
    }

    const verifyGuest = await Guest.findOne({
      firstName: firstName.toLowerCase(),
      lastName: lastName.toLowerCase(),
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

/*Add family and members */
// Route pour ajouter une famille et ses membres
router.post("/add-family", async (req, res) => {
  const { familyName, members } = req.body;

  if (!familyName || !Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ error: "Données invalides." });
  }

  try {
    // Créer une nouvelle famille
    const family = new Family({ familyName, members: [] });
    await family.save();

    // Créer les invités (membres) et les associer à la famille
    const guestPromises = members.map(async (member) => {
      const guest = new Guest({
        firstName: member.firstName,
        lastName: member.lastName,
        family: family._id, // Associer l'invité à la famille
      });
      const savedGuest = await guest.save();

      // Ajouter l'invité à la liste des membres de la famille
      family.members.push(savedGuest._id);
      return savedGuest;
    });

    // Attendre que tous les invités soient sauvegardés
    await Promise.all(guestPromises);

    // Mettre à jour la famille avec la liste des membres
    await family.save();

    return res
      .status(201)
      .json({ message: "Famille et membres ajoutés avec succès.", family });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Erreur lors de l'ajout de la famille." });
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

    const guestToDisplay = await Guest.findOne({
      firstName: firstName,
      lastName: lastName,
    });

    if (!guestToDisplay) {
      return res.status(404).json({ message: "Invité non trouvé" });
    }

    if (!firstName || !lastName) {
      return res
        .status(409)
        .json({ message: "Veuillez remplir tous les champs" });
    }

    guestToDisplay.allergies = allergies;

    if (mealChoice) {
      guestToDisplay.mealChoice = mealChoice;
    }
    guestToDisplay.isComing = isComing;
    await guestToDisplay.save();
    return res.status(200).json(guestToDisplay);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/*Afficher tous les invités */
router.get("/guests", isAdmin, async (req, res) => {
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
      isComing_plusOne,
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
      family_name: lastName,
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
      isComing: isComing_plusOne,
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

router.post("/addGuests", async (req, res) => {
  try {
    const { firstName, lastName, additionalGuests } = req.body;

    // Vérifier les champs obligatoires
    if (
      !firstName ||
      !lastName ||
      !Array.isArray(additionalGuests) ||
      additionalGuests.length === 0
    ) {
      return res.status(400).json({
        error:
          "Veuillez fournir un invité principal et au moins un invité supplémentaire.",
      });
    }

    // Trouver l'invité principal
    const mainGuest = await Guest.findOne({ firstName, lastName });

    if (!mainGuest) {
      return res.status(404).json({ error: "Invité principal introuvable." });
    }

    // Vérifier si l'invité principal a une limite de plusFamily
    if (!mainGuest.plusFamily || mainGuest.plusFamily <= 0) {
      return res.status(400).json({
        error: "Cet invité ne peut pas ajouter de membres supplémentaires.",
      });
    }

    // Vérifier si le nombre de personnes à ajouter dépasse la limite
    if (additionalGuests.length > mainGuest.plusFamily) {
      return res.status(400).json({
        error: `Vous ne pouvez ajouter que ${mainGuest.plusFamily} personne(s) maximum.`,
      });
    }

    // Vérifier si l'invité principal a déjà une famille
    let family;
    if (mainGuest.family) {
      family = await Family.findById(mainGuest.family);
    } else {
      // Créer une nouvelle famille
      family = new Family({
        family_name: lastName,
        members: [mainGuest._id],
      });
      await family.save();

      // Associer l'invité principal à cette famille
      mainGuest.family = family._id;
      await mainGuest.save();
    }

    // Ajouter les nouveaux invités
    const newGuests = [];
    for (const guest of additionalGuests) {
      const { firstName, lastName, isComing, allergies } = guest;

      if (!firstName || !lastName) {
        return res
          .status(400)
          .json({ error: "Chaque invité doit avoir un prénom et un nom." });
      }

      const newGuest = new Guest({
        firstName,
        lastName,
        isComing,
        allergies,
        family: family._id,
        plusOneOf: `${lastName} ${firstName}`,
      });

      await newGuest.save();
      newGuests.push(newGuest._id);
    }

    // Mettre à jour la famille avec les nouveaux membres
    family.members.push(...newGuests);
    await family.save();

    // Mettre à jour la valeur de plusFamily après l'ajout des invités
    mainGuest.plusFamily -= additionalGuests.length;
    await mainGuest.save();

    return res.status(201).json({
      message: "Invités ajoutés avec succès",
      remainingSlots: mainGuest.plusFamily,
      family,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
