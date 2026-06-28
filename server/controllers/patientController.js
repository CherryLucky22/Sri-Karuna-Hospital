const pool = require('../config/db');

// @desc    Register a new patient
// @route   POST /api/patients
// @access  Private (Reception, Admin)
const registerPatient = async (req, res) => {
    try {
        const {
            name, age, gender, dob, blood_group, mobile_number, alternative_mobile,
            address, village, city, district, state, occupation, emergency_contact
        } = req.body;

        // Generate Patient ID (e.g., SKH000001)
        const [lastPatient] = await pool.query('SELECT patient_id FROM patients ORDER BY id DESC LIMIT 1');
        let nextNumber = 1;
        if (lastPatient.length > 0) {
            const lastId = lastPatient[0].patient_id;
            nextNumber = parseInt(lastId.replace('SKH', '')) + 1;
        }
        const patient_id = `SKH${nextNumber.toString().padStart(6, '0')}`;

        const patientData = [
            patient_id, 
            name, 
            age, 
            gender, 
            dob === '' ? null : dob, 
            blood_group === '' ? null : blood_group, 
            mobile_number, 
            alternative_mobile === '' ? null : alternative_mobile, 
            address === '' ? null : address, 
            village === '' ? null : village, 
            city === '' ? null : city, 
            district === '' ? null : district, 
            state === '' ? null : state, 
            occupation === '' ? null : occupation, 
            emergency_contact === '' ? null : emergency_contact
        ];

        const [result] = await pool.query(
            `INSERT INTO patients 
            (patient_id, name, age, gender, dob, blood_group, mobile_number, alternative_mobile, address, village, city, district, state, occupation, emergency_contact) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            patientData
        );

        res.status(201).json({
            message: 'Patient registered successfully',
            patientId: result.insertId,
            generated_patient_id: patient_id
        });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Patient with this mobile number already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Search patient by mobile number or ID (Global Search)
// @route   GET /api/patients/search?q=9876543210
// @access  Private
const searchPatient = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: 'Search query required' });

        const [patients] = await pool.query(
            `SELECT * FROM patients 
             WHERE mobile_number LIKE ? OR patient_id LIKE ? OR name LIKE ?`,
            [`%${q}%`, `%${q}%`, `%${q}%`]
        );

        res.json(patients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get complete patient history
// @route   GET /api/patients/:id/history
// @access  Private
const getPatientHistory = async (req, res) => {
    try {
        const patientId = req.params.id;

        // Get Patient Info
        const [patient] = await pool.query('SELECT * FROM patients WHERE id = ?', [patientId]);
        if (patient.length === 0) return res.status(404).json({ message: 'Patient not found' });

        // Get Visits with Doctor and Vitals
        const [visits] = await pool.query(
            `SELECT v.*, d.qualifications, d.doctor_name, dep.name as department_name 
             FROM visits v
             JOIN doctors d ON v.doctor_id = d.id
             JOIN departments dep ON d.department_id = dep.id
             WHERE v.patient_id = ? ORDER BY v.visit_date DESC`,
            [patientId]
        );

        for (let visit of visits) {
            // Get Vitals
            const [vitals] = await pool.query('SELECT * FROM vitals WHERE visit_id = ?', [visit.id]);
            visit.vitals = vitals.length > 0 ? vitals[0] : null;

            // Get Prescription
            const [prescriptions] = await pool.query('SELECT * FROM prescriptions WHERE visit_id = ?', [visit.id]);
            if (prescriptions.length > 0) {
                const prescription = prescriptions[0];
                const [medicines] = await pool.query('SELECT * FROM prescription_medicines WHERE prescription_id = ?', [prescription.id]);
                prescription.medicines = medicines;
                visit.prescription = prescription;
            } else {
                visit.prescription = null;
            }

            // Get Lab Reports
            const [labReports] = await pool.query(
                `SELECT lr.*, lt.name as test_name 
                 FROM lab_reports lr
                 JOIN lab_tests lt ON lr.test_id = lt.id
                 WHERE lr.visit_id = ?`, [visit.id]
            );
            visit.lab_reports = labReports;
        }

        // Get Pharmacy Bills
        const [bills] = await pool.query('SELECT * FROM pharmacy_bills WHERE patient_id = ? ORDER BY bill_date DESC', [patientId]);

        res.json({
            patient: patient[0],
            visits,
            pharmacy_bills: bills
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { registerPatient, searchPatient, getPatientHistory };
