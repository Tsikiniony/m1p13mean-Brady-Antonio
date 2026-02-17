const express = require("express");
const router = express.Router();
const boutiquesController = require("../controllers/boutiquesController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.get(
  "/with-box-flag",
  protect,
  authorizeRoles("boutique"),
  boutiquesController.listMineWithBoxFlag
);
router.get("/", protect, authorizeRoles("boutique"), boutiquesController.listMine);
router.post("/", protect, authorizeRoles("boutique"), boutiquesController.create);
router.get("/:id", protect, authorizeRoles("boutique"), boutiquesController.getMineById);
router.get("/:id/box", protect, authorizeRoles("boutique"), boutiquesController.getMineBox);
router.put("/:id", protect, authorizeRoles("boutique"), boutiquesController.updateMineById);

module.exports = router;
