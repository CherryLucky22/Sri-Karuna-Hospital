const express = require('express');
const router = express.Router();
const { registerPatient, searchPatient, getPatientHistory } = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validateMiddleware');

router.post('/', protect, authorizeRoles('Reception', 'Admin'), registerPatient);
router.get('/search', protect, authorizeRoles('Reception', 'Doctor', 'Laboratory', 'Pharmacy', 'Admin'), searchPatient);
router.get('/:id/history', protect, authorizeRoles('Reception', 'Doctor', 'Laboratory', 'Pharmacy', 'Admin'), validateObjectId('id'), getPatientHistory);

module.exports = router;
