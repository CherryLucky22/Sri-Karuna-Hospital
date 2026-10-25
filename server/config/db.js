const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hospital_management';
        const conn = await mongoose.connect(uri);
        console.log(`\x1b[32m🚀 MongoDB connected successfully: ${conn.connection.host}\x1b[0m`);
        return conn;
    } catch (error) {
        console.error('\x1b[31mMongoDB connection failed:\x1b[0m', error.message);
        console.error('Please verify your MONGODB_URI in server/.env');
        throw error;
    }
};

module.exports = connectDB;
