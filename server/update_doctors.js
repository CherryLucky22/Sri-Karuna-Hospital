const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function updateDoctorsTable() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Uday@2006',
            database: process.env.DB_NAME || 'hospital_management',
        });

        console.log('Adding column...');
        try {
            await pool.query('ALTER TABLE doctors ADD COLUMN doctor_name VARCHAR(100) AFTER user_id');
            console.log('Column added.');
        } catch(e) {
            if(e.code === 'ER_DUP_FIELDNAME') console.log('Column already exists.');
            else throw e;
        }

        console.log('Updating names...');
        const [result] = await pool.query('UPDATE doctors d JOIN users u ON d.user_id = u.id SET d.doctor_name = u.name');
        console.log(`Updated ${result.affectedRows} doctors with their names.`);
        
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

updateDoctorsTable();
