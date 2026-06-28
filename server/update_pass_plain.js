const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function updatePasswords() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Uday@2006',
            database: process.env.DB_NAME || 'hospital_management',
        });

        const [result] = await pool.query('UPDATE users SET password = ?', ['password123']);
        console.log(`Updated ${result.affectedRows} users with plain text password.`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

updatePasswords();
