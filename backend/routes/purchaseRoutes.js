const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorizeRoles('client'));

router.post('/checkout', purchaseController.checkout);
router.get('/mine', purchaseController.listMine);
router.get('/mine/:id', purchaseController.getMineById);

module.exports = router;
