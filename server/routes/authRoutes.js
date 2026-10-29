const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Brute-force protection: Max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts. For security reasons, please try again after 15 minutes.' }
});

router.post('/login', loginLimiter, loginUser);
router.get('/me', protect, getMe);

module.exports = router;
