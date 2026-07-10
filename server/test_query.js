const pool = require('./config/db');

async function test() {
    try {
        const [doctors] = await pool.query('DESCRIBE doctors');
        console.log('Doctors table schema:', doctors);
        const [users] = await pool.query('DESCRIBE users');
        console.log('Users table schema:', users);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

test();
