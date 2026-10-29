const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            token = authHeader.split(' ')[1];
            if (!token || token.trim() === '') {
                return res.status(401).json({ message: 'Authentication failed: Empty token provided' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hospital_secure_fallback_secret_key_2026');

            // Confirm that the user still exists in the database
            const user = await User.findById(decoded.id).select('name email role');
            if (!user) {
                return res.status(401).json({ message: 'Authentication failed: User account no longer exists' });
            }

            req.user = {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role
            };
            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed: Invalid or expired token' });
        }
    }

    return res.status(401).json({ message: 'Authentication failed: No token provided' });
};

module.exports = { protect };
