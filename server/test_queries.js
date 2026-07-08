const pool = require('./config/db');

async function test() {
    try {
        const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
        console.log("today:", today);
        
        console.log("Testing Daily...");
        const [[dailyPatients]] = await pool.query(`SELECT COUNT(*) as count, SUM(consultation_fee) as revenue FROM visits WHERE visit_date = ?`, [today]);
        console.log(dailyPatients);

        console.log("Testing Weekly...");
        const [[weeklyPatients]] = await pool.query(`SELECT COUNT(*) as count, SUM(consultation_fee) as revenue FROM visits WHERE visit_date >= DATE_SUB(?, INTERVAL 7 DAY)`, [today]);
        console.log(weeklyPatients);

        console.log("Testing Monthly...");
        const [[monthlyPatients]] = await pool.query(`SELECT COUNT(*) as count, SUM(consultation_fee) as revenue FROM visits WHERE MONTH(visit_date) = MONTH(?) AND YEAR(visit_date) = YEAR(?)`, [today, today]);
        console.log(monthlyPatients);

        console.log("Testing Last Month...");
        const [[lastMonthPatients]] = await pool.query(`SELECT COUNT(*) as count, SUM(consultation_fee) as revenue FROM visits WHERE MONTH(visit_date) = MONTH(DATE_SUB(?, INTERVAL 1 MONTH)) AND YEAR(visit_date) = YEAR(DATE_SUB(?, INTERVAL 1 MONTH))`, [today, today]);
        console.log(lastMonthPatients);

    } catch (e) {
        console.error("ERROR CAUGHT:");
        console.error(e);
    } finally {
        process.exit();
    }
}

test();
