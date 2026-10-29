const express = require('express');
const router = express.Router();
const { getDoctorDashboard, savePrescription, getDoctorsList, getPrescriptionSummary, getHospitalAnalysis } = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validateMiddleware');

router.get('/dashboard', protect, authorizeRoles('Doctor', 'Admin'), getDoctorDashboard);
router.get('/analysis', protect, authorizeRoles('Doctor', 'Admin'), getHospitalAnalysis);
router.post('/prescribe', protect, authorizeRoles('Doctor'), savePrescription);
router.get('/list', protect, authorizeRoles('Doctor', 'Reception', 'Admin', 'Laboratory', 'Pharmacy'), getDoctorsList);
router.get('/prescription-summary/:visitId', protect, authorizeRoles('Doctor', 'Pharmacy', 'Admin', 'Reception'), validateObjectId('visitId'), getPrescriptionSummary);

module.exports = router;
