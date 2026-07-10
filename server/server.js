const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/visits', require('./routes/visitRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/pharmacy', require('./routes/pharmacyRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/lab', require('./routes/labRoutes'));

app.get('/api/health', async (req, res) => {
    try {
        const pool = require('./config/db');
        const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        let errors = [];
        let results = {};
        
        try {
            const [[dailyPatients]] = await pool.query(`SELECT COUNT(*) as count, SUM(consultation_fee) as revenue FROM visits WHERE visit_date = ?`, [today]);
            results.daily = dailyPatients;
        } catch (e) { errors.push("daily: " + e.message); }

        try {
            const [[weeklyPatients]] = await pool.query(`SELECT COUNT(*) as count, SUM(consultation_fee) as revenue FROM visits WHERE visit_date >= DATE_SUB(?, INTERVAL 7 DAY)`, [today]);
            results.weekly = weeklyPatients;
        } catch (e) { errors.push("weekly: " + e.message); }

        try {
            const [[monthlyPatients]] = await pool.query(`SELECT COUNT(*) as count, SUM(consultation_fee) as revenue FROM visits WHERE MONTH(visit_date) = MONTH(?) AND YEAR(visit_date) = YEAR(?)`, [today, today]);
            results.monthly = monthlyPatients;
        } catch (e) { errors.push("monthly: " + e.message); }

        res.json({ status: 'ok', results, errors, today });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong on the server', error: err.message });
});

// Setup Lab Tests if empty
require('./setup_lab');

// Dump schema
(async () => {
    try {
        const pool = require('./config/db');
        const [doctors] = await pool.query('DESCRIBE doctors');
        const [users] = await pool.query('DESCRIBE users');
        require('fs').writeFileSync('schema.txt', JSON.stringify({doctors, users}, null, 2));
    } catch(e) {
        require('fs').writeFileSync('schema.txt', e.toString());
    }
})();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
