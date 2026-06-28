const pool = require('../config/db');

// Get catalog of all lab tests
exports.getAllLabTests = async (req, res) => {
    try {
        const [tests] = await pool.query('SELECT * FROM lab_tests ORDER BY category, name');
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching lab tests', error: error.message });
    }
};

// Doctor prescribes a lab test
exports.prescribeLabTest = async (req, res) => {
    const { visitId, testId, remarks } = req.body;
    try {
        await pool.query(
            'INSERT INTO lab_reports (visit_id, test_id, remarks) VALUES (?, ?, ?)',
            [visitId, testId, remarks]
        );
        res.status(201).json({ message: 'Lab test prescribed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error prescribing lab test', error: error.message });
    }
};

// Lab Technician fetches reports (Pending or Completed)
exports.getLabReports = async (req, res) => {
    try {
        const [reports] = await pool.query(`
            SELECT 
                lr.id, lr.visit_id, lr.test_id, lr.result_value, lr.remarks, lr.lab_remarks, lr.status, lr.updated_at,
                lt.name as test_name, lt.category, lt.normal_range, lt.unit,
                v.doctor_id, d.name as doctor_name,
                p.patient_id as patient_code, p.name as patient_name, p.age, p.gender
            FROM lab_reports lr
            JOIN lab_tests lt ON lr.test_id = lt.id
            JOIN visits v ON lr.visit_id = v.id
            LEFT JOIN users d ON v.doctor_id = d.id
            JOIN patients p ON v.patient_id = p.id
            ORDER BY lr.updated_at DESC
        `);
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching lab reports', error: error.message });
    }
};

// Lab Technician updates a report with result
exports.updateLabReport = async (req, res) => {
    const { id } = req.params;
    const { result_value, labRemarks, status } = req.body;
    
    try {
        await pool.query(
            'UPDATE lab_reports SET result_value = ?, lab_remarks = ?, status = ? WHERE id = ?',
            [result_value, labRemarks, status || 'Completed', id]
        );
        res.json({ message: 'Lab report updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating lab report', error: error.message });
    }
};

// Add Walk-in Lab Test
exports.addWalkInTest = async (req, res) => {
    const { name, mobile_number, age, gender, tests, payment_method } = req.body;
    const connection = await pool.getConnection();

    try {
        if (!name || !mobile_number || !tests || tests.length === 0) {
            return res.status(400).json({ message: 'Missing required fields or tests' });
        }

        await connection.beginTransaction();

        // 1. Check if patient exists
        let patientId;
        const [existingPatient] = await connection.query(
            'SELECT id FROM patients WHERE mobile_number = ?',
            [mobile_number]
        );

        if (existingPatient.length > 0) {
            patientId = existingPatient[0].id;
        } else {
            // Create new patient
            const [patientCount] = await connection.query('SELECT COUNT(*) as count FROM patients');
            const newPatientIdStr = `SKH${String(patientCount[0].count + 1).padStart(6, '0')}`;
            
            const [newPatient] = await connection.query(
                'INSERT INTO patients (patient_id, name, age, gender, mobile_number) VALUES (?, ?, ?, ?, ?)',
                [newPatientIdStr, name, age || null, gender || null, mobile_number]
            );
            patientId = newPatient.insertId;
        }

        // 2. The Dummy Doctor ID for Walk-ins is 4 (Self / Walk-in)
        const doctorId = 4; 
        const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // 3. Create dummy visit
        const [visitResult] = await connection.query(
            `INSERT INTO visits (patient_id, doctor_id, op_token, visit_date, visit_time, consultation_fee, payment_method, status)
             VALUES (?, ?, ?, ?, CURTIME(), ?, ?, ?)`,
            [patientId, doctorId, 'LAB-WALKIN', today, 0, payment_method || 'Cash', 'Completed']
        );
        const visitId = visitResult.insertId;

        // 4. Create lab reports for each test
        if (tests && tests.length > 0) {
            for (const testId of tests) {
                await connection.query(
                    'INSERT INTO lab_reports (visit_id, test_id) VALUES (?, ?)',
                    [visitId, testId]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Walk-in test created successfully', visitId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Error creating walk-in test', error: error.message });
    } finally {
        connection.release();
    }
};
