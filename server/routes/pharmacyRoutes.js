const express = require('express');
const router = express.Router();
const { getInventory, searchMedicine, createBill, getPendingPrescriptions, addMedicine, updateMedicine } = require('../controllers/pharmacyController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validateMiddleware');

router.get('/inventory', protect, authorizeRoles('Pharmacy', 'Doctor', 'Admin'), getInventory);
router.post('/inventory', protect, authorizeRoles('Pharmacy', 'Admin'), addMedicine);
router.put('/inventory/:id', protect, authorizeRoles('Pharmacy', 'Admin'), validateObjectId('id'), updateMedicine);
router.get('/search', protect, authorizeRoles('Pharmacy', 'Doctor', 'Admin'), searchMedicine);
router.post('/bill', protect, authorizeRoles('Pharmacy', 'Admin'), createBill);
router.get('/pending-prescriptions', protect, authorizeRoles('Pharmacy', 'Admin'), getPendingPrescriptions);

module.exports = router;
