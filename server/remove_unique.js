const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function removeUniqueConstraint() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Uday@2006',
            database: process.env.DB_NAME || 'hospital_management',
        });

        console.log('Dropping unique constraint on mobile_number...');
        try {
            await pool.query('ALTER TABLE patients DROP INDEX mobile_number');
            console.log('Unique constraint removed successfully.');
        } catch(e) {
            // Error 1091 means the index does not exist
            if(e.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('Constraint already removed or does not exist.');
            } else {
                throw e;
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

removeUniqueConstraint();
