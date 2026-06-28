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
                lr.id, lr.result_value, lr.remarks, lr.status, lr.created_at, lr.updated_at,
                lt.name as test_name, lt.category, lt.normal_range, lt.unit,
                v.id as visit_id, p.name as patient_name, p.patient_id as patient_code, p.age, p.gender,
                d.doctor_name
            FROM lab_reports lr
            JOIN lab_tests lt ON lr.test_id = lt.id
            JOIN visits v ON lr.visit_id = v.id
            JOIN patients p ON v.patient_id = p.id
            JOIN doctors d ON v.doctor_id = d.id
            ORDER BY lr.created_at DESC
        `);
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching lab reports', error: error.message });
    }
};

// Lab Technician updates a report with result
exports.updateLabReport = async (req, res) => {
    const { id } = req.params;
    const { result_value, remarks, status } = req.body;
    
    try {
        await pool.query(
            'UPDATE lab_reports SET result_value = ?, remarks = ?, status = ? WHERE id = ?',
            [result_value, remarks, status || 'Completed', id]
        );
        res.json({ message: 'Lab report updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating lab report', error: error.message });
    }
};
