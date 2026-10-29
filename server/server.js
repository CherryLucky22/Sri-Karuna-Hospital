const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const connectDB = require('./config/db');
const seedDatabase = require('./seed');

const app = express();

// Disable x-powered-by header to prevent server fingerprinting
app.disable('x-powered-by');

// 1. Security Headers (Helmet)
app.use(helmet({
    contentSecurityPolicy: false, // SPA handles resources
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Connect to MongoDB & Seed initial collections
connectDB()
    .then(async () => {
        await seedDatabase();
    })
    .catch(err => {
        console.error('MongoDB startup warning:', err.message);
    });

// 2. Strict CORS Configuration
const defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
];

let configuredOrigins = [...defaultAllowedOrigins];
if (process.env.FRONTEND_URL) {
    const urls = process.env.FRONTEND_URL.split(',').map(s => s.trim().replace(/\/+$/, ''));
    configuredOrigins = [...configuredOrigins, ...urls];
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, same-origin, curl)
        if (!origin) return callback(null, true);
        if (configuredOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        return callback(new Error('CORS blocked: Origin not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Body parsers with payload size limits to prevent Denial of Service (DoS)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Data Sanitization against NoSQL query injection (Express 5 compatible in-place sanitization)
app.use((req, res, next) => {
    if (req.body) mongoSanitize.sanitize(req.body);
    if (req.params) mongoSanitize.sanitize(req.params);
    if (req.query) mongoSanitize.sanitize(req.query);
    next();
});

// 5. Global API Rate Limiter: Max 500 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', apiLimiter);

// 6. Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/visits', require('./routes/visitRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/pharmacy', require('./routes/pharmacyRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/lab', require('./routes/labRoutes'));

// 7. Secure Health Check Endpoint (Does not leak financial/patient records to outsiders)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
    const clientDistPath = path.join(__dirname, '../client/dist');
    app.use(express.static(clientDistPath));
    app.get('{*splat}', (req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
}

// 8. Centralized Secure Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err.message, err.stack);
    const isProd = process.env.NODE_ENV === 'production';
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        message: isProd ? 'An internal server error occurred' : (err.message || 'Something went wrong on the server')
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running securely on port ${PORT}`);
});
