const mysql = require('mysql2/promise');

async function run() {
    try {
        require('dotenv').config();
        const db = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Uday@2006',
            database: process.env.DB_NAME || 'hospital_management'
        });

        await db.query('DROP TABLE IF EXISTS lab_reports;');
        await db.query('DROP TABLE IF EXISTS lab_tests;');
        
        await db.query(`
        CREATE TABLE IF NOT EXISTS lab_tests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL UNIQUE,
            category VARCHAR(100),
            price DECIMAL(10, 2) NOT NULL,
            normal_range VARCHAR(255),
            unit VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`);

        await db.query(`
        CREATE TABLE IF NOT EXISTS lab_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            visit_id INT NOT NULL,
            test_id INT NOT NULL,
            result_value VARCHAR(255),
            remarks TEXT,
            lab_remarks TEXT,
            status ENUM('Pending', 'Completed') DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
            FOREIGN KEY (test_id) REFERENCES lab_tests(id) ON DELETE CASCADE
        );`);

        await db.query(`
        INSERT IGNORE INTO lab_tests (name, category, price, normal_range, unit) VALUES
        ('Complete Blood Count (CBC)', 'Hematology', 450.00, 'WBC: 4000-11000, RBC: 4.5-5.5', 'cells/mcL'),
        ('Fasting Blood Sugar (FBS)', 'Biochemistry', 150.00, '70-100', 'mg/dL'),
        ('Lipid Profile', 'Biochemistry', 800.00, 'Cholesterol < 200, Triglycerides < 150', 'mg/dL'),
        ('Liver Function Test (LFT)', 'Biochemistry', 900.00, 'Bilirubin: 0.1-1.2', 'mg/dL'),
        ('Thyroid Profile (T3, T4, TSH)', 'Endocrinology', 600.00, 'TSH: 0.4-4.0', 'mIU/L'),
        ('X-Ray Chest PA View', 'Radiology', 350.00, 'Normal Study', '-');
        `);

        // Insert Lab Technician user if doesn't exist
        const [users] = await db.query("SELECT * FROM users WHERE email = 'lab@srikarunahospital.com'");
        if (users.length === 0) {
            await db.query(`
            INSERT INTO users (name, email, password, role, phone) VALUES 
            ('Lab Technician', 'lab@srikarunahospital.com', '$2b$10$wN9M/8G.m1nNXXyH.jYgV.8CjO9dJ9B0G7H6H8H9H0H1H2H3H4H5H', 'Laboratory', '9999999999');
            `);
        }

        console.log('Successfully setup Lab Tables!');
    } catch (err) {
        console.error(err);
    }
}

run();
