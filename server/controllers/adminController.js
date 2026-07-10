const pool = require('../config/db');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getAdminDashboardStats = async (req, res) => {
    try {
        const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Today's Stats
        const [[{ todaysOP }]] = await pool.query('SELECT COUNT(*) as todaysOP FROM visits WHERE visit_date = ?', [today]);
        
        const [[{ todaysRevenue }]] = await pool.query('SELECT SUM(consultation_fee) as todaysRevenue FROM visits WHERE visit_date = ?', [today]);
        
        const [[{ todaysPharmacySales }]] = await pool.query('SELECT SUM(net_amount) as todaysPharmacySales FROM pharmacy_bills WHERE bill_date = ?', [today]);

        // Total Stats
        const [[{ totalPatients }]] = await pool.query('SELECT COUNT(*) as totalPatients FROM patients');
        const [[{ totalDoctors }]] = await pool.query('SELECT COUNT(*) as totalDoctors FROM doctors');
        const [[{ totalRevenue }]] = await pool.query('SELECT SUM(consultation_fee) as totalRevenue FROM visits');
        const [[{ totalPharmacySales }]] = await pool.query('SELECT SUM(net_amount) as totalPharmacySales FROM pharmacy_bills');
        
        // Department Wise Patients (for Chart)
        const [deptPatients] = await pool.query(
            `SELECT dep.name, COUNT(v.id) as count 
             FROM visits v
             JOIN doctors d ON v.doctor_id = d.id
             JOIN departments dep ON d.department_id = dep.id
             GROUP BY dep.id`
        );

        // Daily OP Trend (last 7 days)
        const [dailyOP] = await pool.query(
            `SELECT visit_date as date, COUNT(*) as count 
             FROM visits 
             WHERE visit_date >= DATE_SUB(?, INTERVAL 7 DAY)
             GROUP BY visit_date ORDER BY visit_date ASC`, [today]
        );

        // Daily Revenue Trend (last 7 days)
        const [dailyRevenue] = await pool.query(
            `SELECT visit_date as date, SUM(consultation_fee) as revenue
             FROM visits
             WHERE visit_date >= DATE_SUB(?, INTERVAL 7 DAY)
             GROUP BY visit_date ORDER BY visit_date ASC`, [today]
        );

        res.json({
            stats: {
                todaysOP,
                todaysRevenue: (parseFloat(todaysRevenue) || 0) + (parseFloat(todaysPharmacySales) || 0),
                todaysPharmacySales: parseFloat(todaysPharmacySales) || 0,
                totalPatients,
                totalDoctors,
                totalRevenue: (parseFloat(totalRevenue) || 0) + (parseFloat(totalPharmacySales) || 0)
            },
            charts: {
                deptPatients,
                dailyOP,
                dailyRevenue
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT u.id, u.name, u.email, u.role, u.phone, u.created_at, d.specialization, d.consultation_fee 
            FROM users u
            LEFT JOIN doctors d ON u.id = d.user_id
            ORDER BY u.created_at DESC
        `);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private (Admin)
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, phone, specialization, consultation_fee } = req.body;
        const bcrypt = require('bcrypt');
        
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ message: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role, phone]
        );

        if (role === 'Doctor') {
            const [deps] = await pool.query('SELECT id FROM departments LIMIT 1');
            const defaultDept = deps.length > 0 ? deps[0].id : null;
            await pool.query(
                'INSERT INTO doctors (user_id, doctor_name, specialization, consultation_fee, department_id) VALUES (?, ?, ?, ?, ?)',
                [result.insertId, name, specialization || 'General Physician', consultation_fee || 0, defaultDept]
            );
        }

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        require('fs').writeFileSync('error.txt', error.toString() + '\\n' + error.stack);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
    try {
        const { name, email, role, phone, password, specialization, consultation_fee } = req.body;
        const userId = req.params.id;
        
        let query = 'UPDATE users SET name=?, email=?, role=?, phone=? WHERE id=?';
        let params = [name, email, role, phone, userId];

        if (password) {
            const bcrypt = require('bcrypt');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query = 'UPDATE users SET name=?, email=?, role=?, phone=?, password=? WHERE id=?';
            params = [name, email, role, phone, hashedPassword, userId];
        }

        await pool.query(query, params);

        if (role === 'Doctor') {
            const [doc] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
            if (doc.length > 0) {
                await pool.query('UPDATE doctors SET doctor_name = ?, specialization = ?, consultation_fee = ? WHERE user_id = ?', [name, specialization || 'General Physician', consultation_fee || 0, userId]);
            } else {
                const [deps] = await pool.query('SELECT id FROM departments LIMIT 1');
                const defaultDept = deps.length > 0 ? deps[0].id : null;
                await pool.query('INSERT INTO doctors (user_id, doctor_name, specialization, consultation_fee, department_id) VALUES (?, ?, ?, ?, ?)', [userId, name, specialization || 'General Physician', consultation_fee || 0, defaultDept]);
            }
        }

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id=?', [req.params.id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getAdminDashboardStats, getUsers, createUser, updateUser, deleteUser };
