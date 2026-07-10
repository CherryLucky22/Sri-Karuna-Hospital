require('dotenv').config();
const pool = require('./config/db');

async function test() {
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', ['naveen@karuna.com']);
        console.log('User:', users);
        const [allUsers] = await pool.query('SELECT * FROM users');
        console.log('All Users:', allUsers);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
