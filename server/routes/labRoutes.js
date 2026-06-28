const express = require('express');
const router = express.Router();
const { getAllLabTests, prescribeLabTest, getLabReports, updateLabReport } = require('../controllers/labController');
const { protect } = require('../middleware/authMiddleware');

// Get all lab tests available (Catalog)
router.get('/tests', protect, getAllLabTests);

// Doctor prescribes a lab test
router.post('/prescribe', protect, prescribeLabTest);

// Lab tech fetches all reports
router.get('/reports', protect, getLabReports);

// Lab tech updates a report (enter results)
router.put('/report/:id', protect, updateLabReport);

module.exports = router;
