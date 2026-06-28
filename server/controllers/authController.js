const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const loginUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Please provide email, password and role' });
        }

        const [rows] = await pool.query(`
            SELECT u.*, d.specialization, d.qualifications
            FROM users u
            LEFT JOIN doctors d ON u.id = d.user_id
            WHERE u.email = ? AND u.role = ?
        `, [email, role]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials or role mismatch' });
        }

        const user = rows[0];

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

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            specialization: user.specialization,
            qualifications: user.qualifications,
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.name, u.email, u.role, u.phone,
                   d.specialization, d.qualifications
            FROM users u
            LEFT JOIN doctors d ON u.id = d.user_id
            WHERE u.id = ?
        `, [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { loginUser, getMe };
