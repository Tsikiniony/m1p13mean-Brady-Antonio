const express = require("express");
const router = express.Router();
const boxController = require("../controllers/boxController");
const { upload } = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Public: lecture seule
router.get("/public", boxController.getPublicBoxes);
router.get("/public/:id", boxController.getPublicBoxById);

// Boutique: lecture boxes pour demander (inclut demandes de ses boutiques uniquement)
router.get(
  "/for-request",
  protect,
  authorizeRoles("boutique"),
  boxController.getBoxesForBoutiqueRequest
);

// Boutique: demander une box
router.post(
  "/:id/request",
  protect,
  authorizeRoles("boutique"),
  boxController.requestBox
);

router.post(
  "/:id/cancel/request",
  protect,
  authorizeRoles("boutique"),
  boxController.requestCancel
);

router.get(
  "/my-rents",
  protect,
  authorizeRoles("boutique"),
  boxController.getMyRents
);

// Admin: CRUD
router.get("/", protect, authorizeRoles("admin"), boxController.getAllBoxes);
router.put(
  "/:id/rent/extend",
  protect,
  authorizeRoles("admin"),
  boxController.extendRent
);
router.get(
  "/requests/pending",
  protect,
  authorizeRoles("admin"),
  boxController.getPendingRequests
);

router.get(
  "/cancel-requests/pending",
  protect,
  authorizeRoles("admin"),
  boxController.getPendingCancelRequests
);
// Admin: historique complet
router.get(
  "/requests/history",
  protect,
  authorizeRoles("admin"),
  boxController.getRequestsHistory
);

// Boutique: mon historique
router.get(
  "/requests/my-history",
  protect,
  authorizeRoles("boutique"),
  boxController.getMyRequestsHistory
);
router.get("/:id", protect, authorizeRoles("admin"), boxController.getBoxById);
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  upload.single("image"),
  boxController.createBox
);
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  upload.single("image"),
  boxController.updateBox
);
router.delete("/:id", protect, authorizeRoles("admin"), boxController.deleteBox);

router.put(
  "/:id/requests/:requestId/approve",
  protect,
  authorizeRoles("admin"),
  boxController.approveRequest
);
router.put(
  "/:id/requests/:requestId/reject",
  protect,
  authorizeRoles("admin"),
  boxController.rejectRequest
);

router.put(
  "/:id/cancel-requests/:cancelRequestId/approve",
  protect,
  authorizeRoles("admin"),
  boxController.approveCancelRequest
);
router.put(
  "/:id/cancel-requests/:cancelRequestId/reject",
  protect,
  authorizeRoles("admin"),
  boxController.rejectCancelRequest
);

module.exports = router;
