const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.get(
  "/admin-only",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({ message: "Bienvenue Admin 👑" });
  }
);

module.exports = router;
