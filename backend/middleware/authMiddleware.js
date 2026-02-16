const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    let token;

    console.log("[protect]", req.method, req.originalUrl, "authHeader=", req.headers.authorization);

    // Vérifier si token existe
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Non autorisé, pas de token" });
    }

    // Vérifier token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer utilisateur
    req.user = await User.findById(decoded.id).select("-password");

    next();

  } catch (error) {
    console.error("[protect] Token invalide", error?.message || error);
    res.status(401).json({ message: "Token invalide" });
  }
};
