const express = require('express');
const router = express.Router();
const { getInventory, searchMedicine, createBill, getPendingPrescriptions, addMedicine, updateMedicine } = require('../controllers/pharmacyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/inventory', protect, getInventory);
router.post('/inventory', protect, addMedicine);
router.put('/inventory/:id', protect, updateMedicine);
router.get('/search', protect, searchMedicine);
router.post('/bill', protect, createBill);
router.get('/pending-prescriptions', protect, getPendingPrescriptions);

module.exports = router;
