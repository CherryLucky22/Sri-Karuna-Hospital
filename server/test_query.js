const pool = require('./config/db');

async function test() {
    try {
        const [visits] = await pool.query('SELECT * FROM visits ORDER BY id DESC LIMIT 5');
        console.log('Visits:', visits);
        
        const [curdate] = await pool.query('SELECT CURDATE() as cd');
        console.log('CURDATE:', curdate);
        
        const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
        console.log('today string:', today);
        
        const [[daily]] = await pool.query(`SELECT COUNT(*) as count, SUM(consultation_fee) as revenue FROM visits WHERE visit_date = CURDATE()`);
        console.log('daily stats (CURDATE):', daily);

        const [[daily2]] = await pool.query(`SELECT COUNT(*) as count, SUM(consultation_fee) as revenue FROM visits WHERE visit_date = ?`, [today]);
        console.log('daily stats (today):', daily2);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

test();
