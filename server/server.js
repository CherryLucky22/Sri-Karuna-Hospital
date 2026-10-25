const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const seedDatabase = require('./seed');

const app = express();

// Connect to MongoDB & Seed initial collections
connectDB()
    .then(async () => {
        await seedDatabase();
    })
    .catch(err => {
        console.error('MongoDB startup warning:', err.message);
    });

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

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const { Visit } = require('./models');
        const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
        const [yearStr, monthStr] = today.split('-');
        const sevenDaysAgo = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const dailyAgg = await Visit.aggregate([
            { $match: { visit_date: today } },
            { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$consultation_fee' } } }
        ]);

        const weeklyAgg = await Visit.aggregate([
            { $match: { visit_date: { $gte: sevenDaysAgo } } },
            { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$consultation_fee' } } }
        ]);

        const monthlyAgg = await Visit.aggregate([
            { $match: { visit_date: { $regex: `^${yearStr}-${monthStr}` } } },
            { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$consultation_fee' } } }
        ]);

        res.json({
            status: 'ok',
            database: 'mongodb',
            results: {
                daily: dailyAgg[0] || { count: 0, revenue: 0 },
                weekly: weeklyAgg[0] || { count: 0, revenue: 0 },
                monthly: monthlyAgg[0] || { count: 0, revenue: 0 }
            },
            today
        });
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
