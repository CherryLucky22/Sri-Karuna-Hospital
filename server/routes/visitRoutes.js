const express = require('express');
const router = express.Router();
const { createVisit, addVitals, getTodayVisits } = require('../controllers/visitController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createVisit);
router.post('/:id/vitals', protect, addVitals);
router.get('/today', protect, getTodayVisits);

module.exports = router;
