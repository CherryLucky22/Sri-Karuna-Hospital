const { Patient, Visit, Doctor, Department, Vitals, Prescription, PrescriptionMedicine, LabReport, LabTest, PharmacyBill } = require('../models');
const { escapeRegex } = require('../middleware/validateMiddleware');

// @desc    Register a new patient
// @route   POST /api/patients
// @access  Private (Reception, Admin)
const registerPatient = async (req, res) => {
    try {
        const {
            name, age, gender, dob, blood_group, mobile_number, alternative_mobile,
            address, village, city, district, state, occupation, emergency_contact
        } = req.body;

        if (!name || !mobile_number) {
            return res.status(400).json({ message: 'Patient name and mobile number are required' });
        }

        const cleanMobile = String(mobile_number).trim();
        if (cleanMobile.length < 5 || cleanMobile.length > 15) {
            return res.status(400).json({ message: 'Invalid mobile number' });
        }

        // Generate Patient ID (e.g., SKH000001)
        const lastPatient = await Patient.findOne().sort({ created_at: -1, _id: -1 });
        let nextNumber = 1;
        if (lastPatient && lastPatient.patient_id) {
            const numPart = parseInt(lastPatient.patient_id.replace('SKH', ''), 10);
            if (!isNaN(numPart)) {
                nextNumber = numPart + 1;
            }
        }
        const patient_id = `SKH${String(nextNumber).padStart(6, '0')}`;

        const patient = await Patient.create({
            patient_id,
            name: String(name).trim().slice(0, 100),
            age: age !== '' && age !== undefined ? Number(age) : null,
            gender: gender || null,
            dob: dob || null,
            blood_group: blood_group || null,
            mobile_number: cleanMobile,
            alternative_mobile: alternative_mobile ? String(alternative_mobile).trim().slice(0, 15) : null,
            address: address ? String(address).trim().slice(0, 255) : null,
            village: village ? String(village).trim().slice(0, 100) : null,
            city: city ? String(city).trim().slice(0, 100) : null,
            district: district ? String(district).trim().slice(0, 100) : null,
            state: state ? String(state).trim().slice(0, 100) : null,
            occupation: occupation ? String(occupation).trim().slice(0, 100) : null,
            emergency_contact: emergency_contact ? String(emergency_contact).trim().slice(0, 100) : null
        });

        res.status(201).json({
            message: 'Patient registered successfully',
            patientId: patient._id.toString(),
            generated_patient_id: patient_id
        });
    } catch (error) {
        console.error('Error registering patient:', error);
        res.status(500).json({ message: 'Server error registering patient' });
    }
};

// @desc    Search patient by mobile number or ID (Global Search)
// @route   GET /api/patients/search?q=9876543210
// @access  Private
const searchPatient = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string' || q.trim() === '') {
            return res.status(400).json({ message: 'Search query required' });
        }

        const safeQuery = escapeRegex(q.trim().slice(0, 100));
        const regex = new RegExp(safeQuery, 'i');
        const patients = await Patient.find({
            $or: [
                { mobile_number: regex },
                { patient_id: regex },
                { name: regex }
            ]
        }).limit(20);

        res.json(patients);
    } catch (error) {
        console.error('Error searching patient:', error);
        res.status(500).json({ message: 'Server error searching patient' });
    }
};

// @desc    Get complete patient history
// @route   GET /api/patients/:id/history
// @access  Private
const getPatientHistory = async (req, res) => {
    try {
        const patientId = req.params.id;

        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const visits = await Visit.find({ patient_id: patient._id })
            .populate({
                path: 'doctor_id',
                populate: { path: 'department_id' }
            })
            .sort({ visit_date: -1, created_at: -1 });

        const formattedVisits = [];
        for (const visit of visits) {
            const vObj = visit.toObject();
            const doctor = visit.doctor_id;
            const dept = doctor ? doctor.department_id : null;

            vObj.doctor_name = doctor ? doctor.doctor_name : 'Unknown';
            vObj.qualifications = doctor ? doctor.qualifications : '';
            vObj.department_name = dept ? dept.name : (doctor ? doctor.specialization : '');

            // Vitals
            const vitals = await Vitals.findOne({ visit_id: visit._id });
            vObj.vitals = vitals ? vitals.toObject() : null;

            // Prescription
            const prescription = await Prescription.findOne({ visit_id: visit._id });
            if (prescription) {
                const medicines = await PrescriptionMedicine.find({ prescription_id: prescription._id });
                const pObj = prescription.toObject();
                pObj.medicines = medicines.map(m => m.toObject());
                vObj.prescription = pObj;
            } else {
                vObj.prescription = null;
            }

            // Lab Reports
            const labReports = await LabReport.find({ visit_id: visit._id }).populate('test_id');
            vObj.lab_reports = labReports.map(lr => ({
                id: lr._id.toString(),
                visit_id: lr.visit_id.toString(),
                test_id: lr.test_id ? lr.test_id._id.toString() : null,
                test_name: lr.test_id ? lr.test_id.name : '',
                result_value: lr.result_value,
                remarks: lr.remarks,
                lab_remarks: lr.lab_remarks,
                status: lr.status,
                created_at: lr.created_at,
                updated_at: lr.updated_at
            }));

            formattedVisits.push(vObj);
        }

        const bills = await PharmacyBill.find({ patient_id: patient._id }).sort({ bill_date: -1, created_at: -1 });

        res.json({
            patient: patient.toObject(),
            visits: formattedVisits,
            pharmacy_bills: bills.map(b => b.toObject())
        });

    } catch (error) {
        console.error('Error fetching patient history:', error);
        res.status(500).json({ message: 'Server error retrieving patient history' });
    }
};

module.exports = { registerPatient, searchPatient, getPatientHistory };

module.exports = { registerPatient, searchPatient, getPatientHistory };
