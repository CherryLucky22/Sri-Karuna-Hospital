const pool = require('../config/db');

// @desc    Get doctor's dashboard info (Today's patients)
// @route   GET /api/doctors/dashboard
// @access  Private (Doctor)
const getDoctorDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        // Get Doctor ID
        const [doctor] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (doctor.length === 0) return res.status(403).json({ message: 'Not authorized as doctor' });
        const doctorId = doctor[0].id;

        const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Get Visits for today
        const [visits] = await pool.query(
            `SELECT v.*, p.name as patient_name, p.patient_id as patient_code, p.age, p.gender 
             FROM visits v
             JOIN patients p ON v.patient_id = p.id
             WHERE v.doctor_id = ? AND v.visit_date = ?
             ORDER BY v.status ASC, v.visit_time ASC`,
            [doctorId, today]
        );

        // Get Vitals for these visits
        for(let visit of visits) {
            const [vitals] = await pool.query('SELECT * FROM vitals WHERE visit_id = ?', [visit.id]);
            visit.vitals = vitals.length > 0 ? vitals[0] : null;
        }

        // Hospital-wide stats for today
        const [receptionList] = await pool.query(
            `SELECT v.id, v.op_token, v.status, p.name as patient_name, p.patient_id as patient_code, d.doctor_name, v.visit_time, v.consultation_fee, v.payment_method 
             FROM visits v 
             JOIN patients p ON v.patient_id = p.id 
             JOIN doctors d ON v.doctor_id = d.id
             WHERE v.visit_date = ?
             ORDER BY v.created_at DESC`, [today]
        );
        
        const [labList] = await pool.query(
            `SELECT l.id, l.status, l.created_at, t.name as test_name, t.price, p.name as patient_name, v.payment_method 
             FROM lab_reports l 
             JOIN lab_tests t ON l.test_id = t.id 
             JOIN visits v ON l.visit_id = v.id 
             JOIN patients p ON v.patient_id = p.id 
             WHERE DATE(l.created_at) = ?
             ORDER BY l.created_at DESC`, [today]
        );

        const [pharmacyList] = await pool.query(
            `SELECT pb.bill_number, pb.total_amount, pb.net_amount, pb.discount, pb.gst, pb.created_at, p.name as patient_name, pb.payment_method 
             FROM pharmacy_bills pb 
             LEFT JOIN patients p ON pb.patient_id = p.id 
             WHERE pb.bill_date = ?
             ORDER BY pb.created_at DESC`, [today]
        );

        res.json({
            todayTotal: visits.length,
            waiting: visits.filter(v => v.status === 'Waiting').length,
            completed: visits.filter(v => v.status === 'Completed').length,
            patients: visits,
            hospitalStats: {
                reception: { count: receptionList.length, data: receptionList },
                laboratory: { count: labList.length, data: labList },
                pharmacy: { count: pharmacyList.length, data: pharmacyList }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Save Prescription
// @route   POST /api/doctors/prescribe
// @access  Private (Doctor)
const savePrescription = async (req, res) => {
    try {
        const { visit_id, chief_complaint, history, clinical_findings, diagnosis, advice, follow_up_date, medicines } = req.body;

        const [result] = await pool.query(
            `INSERT INTO prescriptions 
             (visit_id, chief_complaint, history, clinical_findings, diagnosis, advice, follow_up_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [visit_id, chief_complaint, history, clinical_findings, diagnosis, advice, follow_up_date === '' ? null : follow_up_date]
        );

        const prescriptionId = result.insertId;

        // Save medicines
        if (medicines && medicines.length > 0) {
            for (let med of medicines) {
                await pool.query(
                    `INSERT INTO prescription_medicines 
                     (prescription_id, medicine_id, medicine_name, dosage, morning, afternoon, night, before_food, after_food, duration)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [prescriptionId, med.medicine_id || null, med.medicine_name, med.dosage, med.morning, med.afternoon, med.night, med.before_food, med.after_food, med.duration === '' ? null : med.duration]
                );
            }
        }

        // Update visit status to Completed
        await pool.query('UPDATE visits SET status = ? WHERE id = ?', ['Completed', visit_id]);

        res.status(201).json({ message: 'Prescription saved successfully', prescriptionId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get complete prescription summary for a visit
// @route   GET /api/doctors/prescription-summary/:visitId
// @access  Private (Doctor)
const getPrescriptionSummary = async (req, res) => {
    try {
        const { visitId } = req.params;

        const [prescriptionResult] = await pool.query(
            `SELECT * FROM prescriptions WHERE visit_id = ? ORDER BY created_at DESC LIMIT 1`,
            [visitId]
        );

        if (prescriptionResult.length === 0) {
            return res.status(404).json({ message: 'No prescription found for this visit' });
        }

        const prescription = prescriptionResult[0];

        const [medicines] = await pool.query(
            `SELECT * FROM prescription_medicines WHERE prescription_id = ?`,
            [prescription.id]
        );
        prescription.medicines = medicines;

        const [labReports] = await pool.query(
            `SELECT lr.*, lt.name as test_name, lt.normal_range, lt.unit 
             FROM lab_reports lr
             JOIN lab_tests lt ON lr.test_id = lt.id
             WHERE lr.visit_id = ?`,
            [visitId]
        );
        prescription.lab_reports = labReports;

        res.json(prescription);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all active doctors for dropdowns
// @route   GET /api/doctors/list
// @access  Private
const getDoctorsList = async (req, res) => {
    try {
        const [doctors] = await pool.query(
            `SELECT d.id, d.doctor_name as name, d.specialization, d.consultation_fee, dep.name as department 
             FROM doctors d
             JOIN departments dep ON d.department_id = dep.id`
        );
        res.json(doctors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get hospital analysis (Revenue and Patients)
// @route   GET /api/doctors/analysis
// @access  Private (Doctor)
const getHospitalAnalysis = async (req, res) => {
    try {
        // Daily
        const [[dailyPatients]] = await pool.query(`SELECT COUNT(*) as count, SUM(consultation_fee) as revenue FROM visits WHERE visit_date = CURDATE()`);
        const [[dailyPharmacy]] = await pool.query(`SELECT SUM(net_amount) as revenue FROM pharmacy_bills WHERE bill_date = CURDATE()`);
        
        // Weekly
        const [[weeklyPatients]] = await pool.query(`SELECT COUNT(*) as count, SUM(consultation_fee) as revenue FROM visits WHERE visit_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`);
        const [[weeklyPharmacy]] = await pool.query(`SELECT SUM(net_amount) as revenue FROM pharmacy_bills WHERE bill_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`);
        
        // Monthly
        const [[monthlyPatients]] = await pool.query(`SELECT COUNT(*) as count, SUM(consultation_fee) as revenue FROM visits WHERE MONTH(visit_date) = MONTH(CURDATE()) AND YEAR(visit_date) = YEAR(CURDATE())`);
        const [[monthlyPharmacy]] = await pool.query(`SELECT SUM(net_amount) as revenue FROM pharmacy_bills WHERE MONTH(bill_date) = MONTH(CURDATE()) AND YEAR(bill_date) = YEAR(CURDATE())`);

        res.json({
            daily: {
                patients: dailyPatients.count || 0,
                revenue: (parseFloat(dailyPatients.revenue) || 0) + (parseFloat(dailyPharmacy.revenue) || 0)
            },
            weekly: {
                patients: weeklyPatients.count || 0,
                revenue: (parseFloat(weeklyPatients.revenue) || 0) + (parseFloat(weeklyPharmacy.revenue) || 0)
            },
            monthly: {
                patients: monthlyPatients.count || 0,
                revenue: (parseFloat(monthlyPatients.revenue) || 0) + (parseFloat(monthlyPharmacy.revenue) || 0)
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getDoctorDashboard, savePrescription, getDoctorsList, getPrescriptionSummary, getHospitalAnalysis };
