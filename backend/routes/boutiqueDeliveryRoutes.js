const express = require('express');
const router = express.Router();
const boutiqueDeliveryController = require('../controllers/boutiqueDeliveryController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorizeRoles('boutique'));

router.get('/mine', boutiqueDeliveryController.listMine);
router.get('/mine/:id', boutiqueDeliveryController.getMineById);
router.patch('/mine/:id/status', boutiqueDeliveryController.advanceStatusMine);

module.exports = router;
