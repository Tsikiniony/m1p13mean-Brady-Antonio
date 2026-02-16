const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Toutes les routes nécessitent authentification et rôle admin
router.use(protect);
router.use(authorizeRoles("admin"));

// GET all users
router.get("/", userController.getAllUsers);

// BOUTIQUES (admin)
router.get("/boutiques/pending", userController.getPendingBoutiques);
router.get("/boutiques/approved", userController.getApprovedBoutiques);
router.put("/boutiques/:id/approve", userController.approveBoutique);

// GET user by ID
router.get("/:id", userController.getUserById);

// CREATE user
router.post("/", userController.createUser);

// UPDATE user
router.put("/:id", userController.updateUser);

// DELETE user
router.delete("/:id", userController.deleteUser);

module.exports = router;
