const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong on the server', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
