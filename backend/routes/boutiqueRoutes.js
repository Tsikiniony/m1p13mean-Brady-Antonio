const express = require("express");
const router = express.Router();
const boutiqueController = require("../controllers/boutiqueController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.get("/me", protect, authorizeRoles("boutique"), boutiqueController.getMe);
router.put("/me", protect, authorizeRoles("boutique"), boutiqueController.updateMe);

module.exports = router;
