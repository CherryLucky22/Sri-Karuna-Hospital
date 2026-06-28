const bcrypt = require('bcrypt');
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

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const [result] = await pool.query('UPDATE users SET password = ?', [hashedPassword]);
        console.log(`Updated ${result.affectedRows} users with new password hash.`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

updatePasswords();
