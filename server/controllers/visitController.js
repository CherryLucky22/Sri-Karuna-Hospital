const pool = require('../config/db');

// @desc    Create a visit (OP Registration)
// @route   POST /api/visits
// @access  Private (Reception)
const createVisit = async (req, res) => {
    try {
        const { patient_id, doctor_id, consultation_fee, payment_method, notes } = req.body;

        // Get Department Code for OP Token
        const [doctorInfo] = await pool.query(
            `SELECT d.id, dep.code 
             FROM doctors d 
             JOIN departments dep ON d.department_id = dep.id 
             WHERE d.id = ?`, [doctor_id]
        );

        if (doctorInfo.length === 0) return res.status(404).json({ message: 'Doctor not found' });
        const deptCode = doctorInfo[0].code;

        // Generate OP Token
        const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
        const [lastVisit] = await pool.query(
            `SELECT op_token FROM visits 
             WHERE doctor_id = ? AND visit_date = ? 
             ORDER BY id DESC LIMIT 1`, [doctor_id, today]
        );
        
        let nextTokenNum = 1;
        if (lastVisit.length > 0) {
            const lastToken = lastVisit[0].op_token;
            nextTokenNum = parseInt(lastToken.replace(deptCode, '')) + 1;
        }
        const op_token = `${deptCode}${nextTokenNum.toString().padStart(3, '0')}`;

        const visit_time = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

        const [result] = await pool.query(
            `INSERT INTO visits 
            (patient_id, doctor_id, op_token, visit_date, visit_time, consultation_fee, payment_status, payment_method, notes, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'Paid', ?, ?, 'Waiting')`,
            [patient_id, doctor_id, op_token, today, visit_time, consultation_fee, payment_method, notes]
        );

        res.status(201).json({
            message: 'Visit created successfully',
            visitId: result.insertId,
            op_token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add or Update Vitals for a Visit
// @route   POST /api/visits/:id/vitals
// @access  Private (Reception, Doctor)
const addVitals = async (req, res) => {
    try {
        const visit_id = req.params.id;
        let { heart_rate, blood_pressure, temperature, height, weight, spo2, respiratory_rate } = req.body;
        
        height = height === '' ? null : height;
        weight = weight === '' ? null : weight;

        // Calculate BMI
        let bmi = null;
        if (height && weight) {
            const heightInMeters = height / 100;
            bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
        }

        // Check if vitals already exist
        const [existing] = await pool.query('SELECT id FROM vitals WHERE visit_id = ?', [visit_id]);

        if (existing.length > 0) {
            await pool.query(
                `UPDATE vitals SET 
                 heart_rate=?, blood_pressure=?, temperature=?, height=?, weight=?, bmi=?, spo2=?, respiratory_rate=?
                 WHERE visit_id=?`,
                [heart_rate || null, blood_pressure || null, temperature || null, height, weight, bmi, spo2 || null, respiratory_rate || null, visit_id]
            );
        } else {
            await pool.query(
                `INSERT INTO vitals 
                 (visit_id, heart_rate, blood_pressure, temperature, height, weight, bmi, spo2, respiratory_rate)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [visit_id, heart_rate || null, blood_pressure || null, temperature || null, height, weight, bmi, spo2 || null, respiratory_rate || null]
            );
        }

        res.json({ message: 'Vitals saved successfully', bmi });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get Today's Visits (for Reception Dashboard)
// @route   GET /api/visits/today
// @access  Private
const getTodayVisits = async (req, res) => {
    try {
        const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
        const [visits] = await pool.query(
            `SELECT v.*, p.name as patient_name, p.patient_id as patient_code, p.mobile_number, 
             d.doctor_name, dep.name as department_name
             FROM visits v
             JOIN patients p ON v.patient_id = p.id
             JOIN doctors d ON v.doctor_id = d.id
             JOIN departments dep ON d.department_id = dep.id
             WHERE v.visit_date = ? ORDER BY v.visit_time DESC`,
            [today]
        );
        res.json(visits);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createVisit, addVitals, getTodayVisits };
