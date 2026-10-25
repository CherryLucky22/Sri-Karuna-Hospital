const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hospital_management';
        const options = {};
        if (process.env.DB_NAME) {
            options.dbName = process.env.DB_NAME;
        }
        const conn = await mongoose.connect(uri, options);
        console.log(`\x1b[32m🚀 MongoDB connected successfully: ${conn.connection.host} [DB: ${conn.connection.name}]\x1b[0m`);
        return conn;
    } catch (error) {
        console.error('\x1b[31mMongoDB connection failed:\x1b[0m', error.message);
        console.error('Please verify your MONGO_URI / MONGODB_URI and DB_NAME in server/.env');
        throw error;
    }
};

module.exports = connectDB;
