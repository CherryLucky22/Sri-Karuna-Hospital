const express = require('express');
const router = express.Router();
const { registerPatient, searchPatient, getPatientHistory } = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, registerPatient);
router.get('/search', protect, searchPatient);
router.get('/:id/history', protect, getPatientHistory);

module.exports = router;
