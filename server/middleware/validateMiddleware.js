const mongoose = require('mongoose');

// Helper to escape regex special characters to prevent ReDoS and Regex Injection
const escapeRegex = (text) => {
    if (typeof text !== 'string') return '';
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

// Middleware to validate MongoDB ObjectId in route params
const validateObjectId = (...paramNames) => {
    return (req, res, next) => {
        for (const param of paramNames) {
            const val = req.params[param];
            if (val && !mongoose.Types.ObjectId.isValid(val)) {
                return res.status(400).json({ message: `Invalid identifier format: ${param}` });
            }
        }
        next();
    };
};

module.exports = { escapeRegex, validateObjectId };

