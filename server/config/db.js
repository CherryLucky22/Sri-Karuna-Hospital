const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(connection => {
        console.log('\x1b[32m🚀 MySQL connected successfully\x1b[0m');
        connection.release();
    })
    .catch(err => {
        console.error('MySQL connection failed:', err.message);
    });

module.exports = pool;
