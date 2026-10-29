const express = require('express');
const router = express.Router();
const { getAllLabTests, prescribeLabTest, getLabReports, updateLabReport, addWalkInTest } = require('../controllers/labController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validateMiddleware');

// Get all lab tests available (Catalog)
router.get('/tests', protect, authorizeRoles('Laboratory', 'Doctor', 'Reception', 'Admin'), getAllLabTests);

// Doctor prescribes a lab test
router.post('/prescribe', protect, authorizeRoles('Doctor', 'Admin'), prescribeLabTest);

// Lab tech & Doctor fetch reports
router.get('/reports', protect, authorizeRoles('Laboratory', 'Doctor', 'Admin'), getLabReports);

// Lab tech updates a report (enter results)
router.put('/report/:id', protect, authorizeRoles('Laboratory', 'Admin'), validateObjectId('id'), updateLabReport);

// Lab tech or Reception adds walk-in test
router.post('/walkin', protect, authorizeRoles('Laboratory', 'Reception', 'Admin'), addWalkInTest);

module.exports = router;
