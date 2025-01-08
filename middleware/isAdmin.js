const Admin = require("../models/Admin");

const isAdmin = async (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.replace("Bearer ", "");
    const admin = await Admin.findOne({ token: token });

    if (!admin) {
      return res.status(403).json({ error: "Accès refusé" });
    } else {
      req.admin = admin;
      return next();
    }
  } else {
    return res.status(401).json({ error: "Non autorisé" });
  }
};

module.exports = isAdmin;
