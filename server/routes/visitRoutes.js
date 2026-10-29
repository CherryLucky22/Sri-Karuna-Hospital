const express = require('express');
const router = express.Router();
const { createVisit, addVitals, getTodayVisits } = require('../controllers/visitController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validateMiddleware');

router.post('/', protect, authorizeRoles('Reception', 'Admin'), createVisit);
router.post('/:id/vitals', protect, authorizeRoles('Reception', 'Doctor', 'Admin'), validateObjectId('id'), addVitals);
router.get('/today', protect, authorizeRoles('Reception', 'Doctor', 'Admin'), getTodayVisits);

module.exports = router;
