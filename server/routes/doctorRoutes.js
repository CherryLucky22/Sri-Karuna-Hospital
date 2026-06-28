const express = require('express');
const router = express.Router();
const { getDoctorDashboard, savePrescription, getDoctorsList, getPrescriptionSummary, getHospitalAnalysis } = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getDoctorDashboard);
router.get('/analysis', protect, getHospitalAnalysis);
router.post('/prescribe', protect, savePrescription);
router.get('/list', protect, getDoctorsList);
router.get('/prescription-summary/:visitId', protect, getPrescriptionSummary);

module.exports = router;
