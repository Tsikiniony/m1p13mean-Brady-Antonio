const express = require("express");
const router = express.Router();
const boxController = require("../controllers/boxController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Public: lecture seule
router.get("/public", boxController.getPublicBoxes);
router.get("/public/:id", boxController.getPublicBoxById);

// Admin: CRUD
router.get("/", protect, authorizeRoles("admin"), boxController.getAllBoxes);
router.get("/:id", protect, authorizeRoles("admin"), boxController.getBoxById);
router.post("/", protect, authorizeRoles("admin"), boxController.createBox);
router.put("/:id", protect, authorizeRoles("admin"), boxController.updateBox);
router.delete("/:id", protect, authorizeRoles("admin"), boxController.deleteBox);

module.exports = router;
