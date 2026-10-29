const mongoose = require('mongoose');
const { LabTest, LabReport, Patient, Visit, Doctor, User, Department } = require('../models');

const getISTDate = () => {
    const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
};

// Get catalog of all lab tests
exports.getAllLabTests = async (req, res) => {
    try {
        const tests = await LabTest.find().sort({ category: 1, name: 1 });
        res.json(tests);
    } catch (error) {
        console.error('Error fetching lab tests:', error);
        res.status(500).json({ message: 'Error fetching lab tests' });
    }
};

// Doctor prescribes a lab test
exports.prescribeLabTest = async (req, res) => {
    const { visitId, testId, remarks } = req.body;
    try {
        if (!visitId || !mongoose.Types.ObjectId.isValid(visitId)) {
            return res.status(400).json({ message: 'Valid visit ID required' });
        }
        if (!testId || !mongoose.Types.ObjectId.isValid(testId)) {
            return res.status(400).json({ message: 'Valid lab test ID required' });
        }

        await LabReport.create({
            visit_id: visitId,
            test_id: testId,
            remarks: remarks ? String(remarks).slice(0, 500) : ''
        });
        res.status(201).json({ message: 'Lab test prescribed successfully' });
    } catch (error) {
        console.error('Error prescribing lab test:', error);
        res.status(500).json({ message: 'Error prescribing lab test' });
    }
};

// Lab Technician fetches reports (Pending or Completed)
exports.getLabReports = async (req, res) => {
    try {
        const reports = await LabReport.find()
            .populate('test_id')
            .populate({
                path: 'visit_id',
                populate: [
                    { path: 'patient_id' },
                    { path: 'doctor_id' }
                ]
            })
            .sort({ updated_at: -1 });

        const formatted = reports.map(lr => {
            const visit = lr.visit_id;
            const patient = visit ? visit.patient_id : null;
            const doctor = visit ? visit.doctor_id : null;
            const test = lr.test_id;

            return {
                id: lr._id.toString(),
                _id: lr._id.toString(),
                visit_id: visit ? visit._id.toString() : null,
                test_id: test ? test._id.toString() : null,
                result_value: lr.result_value,
                remarks: lr.remarks,
                lab_remarks: lr.lab_remarks,
                status: lr.status,
                updated_at: lr.updated_at,
                test_name: test ? test.name : 'Unknown Test',
                category: test ? test.category : '',
                normal_range: test ? test.normal_range : '',
                unit: test ? test.unit : '',
                doctor_id: doctor ? doctor._id.toString() : null,
                doctor_name: doctor ? doctor.doctor_name : '',
                patient_code: patient ? patient.patient_id : '',
                patient_name: patient ? patient.name : 'Unknown',
                age: patient ? patient.age : null,
                gender: patient ? patient.gender : null
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching lab reports:', error);
        res.status(500).json({ message: 'Error fetching lab reports' });
    }
};

// Lab Technician updates a report with result
exports.updateLabReport = async (req, res) => {
    const { id } = req.params;
    const { result_value, labRemarks, status } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid report ID' });
        }

        const report = await LabReport.findByIdAndUpdate(
            id,
            {
                result_value: result_value !== undefined ? String(result_value).slice(0, 500) : undefined,
                lab_remarks: labRemarks !== undefined ? String(labRemarks).slice(0, 500) : undefined,
                status: status || 'Completed'
            },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({ message: 'Lab report not found' });
        }

        res.json({ message: 'Lab report updated successfully' });
    } catch (error) {
        console.error('Error updating lab report:', error);
        res.status(500).json({ message: 'Error updating lab report' });
    }
};

// Add Walk-in Lab Test
exports.addWalkInTest = async (req, res) => {
    const { name, mobile_number, age, gender, tests, payment_method } = req.body;

    try {
        if (!name || !mobile_number || !tests || !Array.isArray(tests) || tests.length === 0) {
            return res.status(400).json({ message: 'Missing required fields or tests list' });
        }

        const cleanMobile = String(mobile_number).trim();

        // 1. Check if patient exists
        let patient = await Patient.findOne({ mobile_number: cleanMobile });
        if (!patient) {
            const count = await Patient.countDocuments();
            const newPatientIdStr = `SKH${String(count + 1).padStart(6, '0')}`;
            patient = await Patient.create({
                patient_id: newPatientIdStr,
                name: String(name).trim().slice(0, 100),
                age: age ? Number(age) : null,
                gender: gender || null,
                mobile_number: cleanMobile
            });
        }

        // 2. Find or create Walk-in doctor
        let walkInDoctor = await Doctor.findOne({ doctor_name: 'Self / Walk-in' });
        if (!walkInDoctor) {
            let walkInUser = await User.findOne({ email: 'walkin@sys.com' });
            if (!walkInUser) {
                walkInUser = await User.create({
                    name: 'Walk-in System',
                    email: 'walkin@sys.com',
                    password: 'none',
                    role: 'Reception',
                    phone: '0000000000'
                });
            }
            const dept = await Department.findOne();
            walkInDoctor = await Doctor.create({
                user_id: walkInUser._id,
                doctor_name: 'Self / Walk-in',
                specialization: '-',
                consultation_fee: 0,
                department_id: dept ? dept._id : null
            });
        }

        // 3. Create dummy visit
        const today = getISTDate();
        const visit_time = new Date().toTimeString().split(' ')[0];

        const visit = await Visit.create({
            patient_id: patient._id,
            doctor_id: walkInDoctor._id,
            op_token: 'LAB-WALKIN',
            visit_date: today,
            visit_time,
            consultation_fee: 0,
            payment_method: payment_method || 'Cash',
            status: 'Completed'
        });

        // 4. Create lab reports
        for (const testId of tests) {
            if (mongoose.Types.ObjectId.isValid(testId)) {
                await LabReport.create({
                    visit_id: visit._id,
                    test_id: testId
                });
            }
        }

        res.status(201).json({ message: 'Walk-in test created successfully', visitId: visit._id.toString() });
    } catch (error) {
        console.error('Error creating walk-in test:', error);
        res.status(500).json({ message: 'Error creating walk-in test' });
    }
};
