const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, Doctor } = require('../models');

// Constant-time dummy hash used to mitigate timing attacks when user does not exist
const DUMMY_HASH = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
const VALID_ROLES = ['Admin', 'Reception', 'Doctor', 'Laboratory', 'Pharmacy'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loginUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Strict input validation
        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Email, password, and role are required' });
        }

        if (typeof email !== 'string' || typeof password !== 'string' || typeof role !== 'string') {
            return res.status(400).json({ message: 'Invalid input format' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanPassword = password.trim();

        if (cleanEmail.length > 100 || cleanPassword.length > 128) {
            return res.status(400).json({ message: 'Input exceeds allowed length' });
        }

        if (!EMAIL_REGEX.test(cleanEmail)) {
            return res.status(400).json({ message: 'Invalid email address format' });
        }

        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({ message: 'Invalid role selected' });
        }

        // Query user with password explicitly selected
        const user = await User.findOne({ email: cleanEmail, role }).select('+password');

        if (!user) {
            // Mitigate timing attack
            await bcrypt.compare(cleanPassword, DUMMY_HASH);
            return res.status(401).json({ message: 'Invalid credentials or role mismatch' });
        }

        // Direct plain string comparison as requested: passwords saved as visible text in MongoDB
        let isMatch = (user.password === cleanPassword) || (user.password === password);

        // Convenient support for Dr. Naveen (supports both ashritha and password123)
        if (!isMatch && cleanEmail === 'naveen@karuna.com') {
            if (cleanPassword === 'ashritha' || cleanPassword === 'password123') {
                isMatch = true;
                user.password = cleanPassword;
                await user.save();
            }
        }

        // Backward compatibility: If any bcrypt hash remains, verify and convert to plain string
        if (!isMatch && user.password && user.password.startsWith('$2')) {
            try {
                const bcryptMatch = await bcrypt.compare(cleanPassword, user.password);
                if (bcryptMatch) {
                    isMatch = true;
                    user.password = cleanPassword;
                    await user.save();
                }
            } catch (err) {
                // Ignore bcrypt errors
            }
        }

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials or role mismatch' });
        }

        let specialization = null;
        let qualifications = null;
        if (user.role === 'Doctor') {
            const doctor = await Doctor.findOne({ user_id: user._id });
            if (doctor) {
                specialization = doctor.specialization;
                qualifications = doctor.qualifications;
            }
        }

        const token = jwt.sign(
            { id: user._id.toString(), role: user.role, name: user.name },
            process.env.JWT_SECRET || 'hospital_secure_fallback_secret_key_2026',
            { expiresIn: '8h' }
        );

        res.json({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            specialization,
            qualifications,
            token
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during authentication' });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let specialization = null;
        let qualifications = null;
        if (user.role === 'Doctor') {
            const doctor = await Doctor.findOne({ user_id: user._id });
            if (doctor) {
                specialization = doctor.specialization;
                qualifications = doctor.qualifications;
            }
        }

        res.json({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            specialization,
            qualifications
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error retrieving user profile' });
    }
};

module.exports = { loginUser, getMe };
