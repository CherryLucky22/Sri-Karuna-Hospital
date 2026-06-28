const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Please provide email, password and role' });
        }

        const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND role = ?', [email, role]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials or role mismatch' });
        }

        const user = rows[0];

        const isMatch = (password === user.password);

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
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, email, role, phone FROM users WHERE id = ?', [req.user.id]);
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
