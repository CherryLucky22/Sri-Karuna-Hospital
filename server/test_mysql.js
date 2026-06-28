const mysql = require('mysql2');
const sql = mysql.format('VALUES (?, ?, ?)', ['Male', null, '']);
console.log(sql);
