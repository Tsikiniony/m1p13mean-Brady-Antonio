const express = require("express");
const router = express.Router();
const boutiquesController = require("../controllers/boutiquesController");
const articleController = require("../controllers/articleController");
const { upload } = require("../middleware/uploadMiddleware");
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
router.get(
  "/:id/articles",
  protect,
  authorizeRoles("boutique"),
  articleController.listMineForBoutique
);
router.post(
  "/:id/articles",
  protect,
  authorizeRoles("boutique"),
  upload.single("image"),
  articleController.createMineForBoutique
);
router.get(
  "/:id/articles/:articleId",
  protect,
  authorizeRoles("boutique"),
  articleController.getMineArticleForBoutique
);
router.put(
  "/:id/articles/:articleId",
  protect,
  authorizeRoles("boutique"),
  upload.single("image"),
  articleController.updateMineArticleForBoutique
);
router.delete(
  "/:id/articles/:articleId",
  protect,
  authorizeRoles("boutique"),
  articleController.deleteMineArticleForBoutique
);
router.put("/:id", protect, authorizeRoles("boutique"), boutiquesController.updateMineById);

module.exports = router;
