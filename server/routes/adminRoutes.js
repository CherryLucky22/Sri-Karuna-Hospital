const express = require('express');
const router = express.Router();
const { getAdminDashboardStats, getUsers, createUser, updateUser, deleteUser } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validateMiddleware');

router.get('/dashboard', protect, authorizeRoles('Admin'), getAdminDashboardStats);
router.get('/users', protect, authorizeRoles('Admin'), getUsers);
router.post('/users', protect, authorizeRoles('Admin'), createUser);
router.put('/users/:id', protect, authorizeRoles('Admin'), validateObjectId('id'), updateUser);
router.delete('/users/:id', protect, authorizeRoles('Admin'), validateObjectId('id'), deleteUser);

module.exports = router;
