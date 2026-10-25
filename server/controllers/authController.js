const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, Doctor } = require('../models');

const loginUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Please provide email, password and role' });
        }

        const user = await User.findOne({ email: email.toLowerCase(), role });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or role mismatch' });
        }

        // Support both bcrypt hashed and plain-text passwords for backward compatibility
        let isMatch = false;
        if (user.password && user.password.startsWith('$2')) {
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            isMatch = (password === user.password);
        }

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
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
            process.env.JWT_SECRET,
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
        res.status(500).json({ message: 'Server error during login', error: error.message });
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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { loginUser, getMe };
