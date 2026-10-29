const mongoose = require('mongoose');
const { Visit, Doctor, Department, Patient, Vitals } = require('../models');

const getISTDate = () => {
    const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
};

// @desc    Create a visit (OP Registration)
// @route   POST /api/visits
// @access  Private (Reception, Admin)
const createVisit = async (req, res) => {
    try {
        const { patient_id, doctor_id, consultation_fee, payment_method, notes } = req.body;

        if (!patient_id || !mongoose.Types.ObjectId.isValid(patient_id)) {
            return res.status(400).json({ message: 'Valid patient ID is required' });
        }
        if (!doctor_id || !mongoose.Types.ObjectId.isValid(doctor_id)) {
            return res.status(400).json({ message: 'Valid doctor ID is required' });
        }

        // Get Department Code for OP Token
        const doctor = await Doctor.findById(doctor_id).populate('department_id');
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const deptCode = (doctor.department_id && doctor.department_id.code)
            ? doctor.department_id.code
            : 'OP';

        // Generate OP Token
        const today = getISTDate();
        const lastVisit = await Visit.findOne({
            doctor_id: doctor._id,
            visit_date: today
        }).sort({ created_at: -1, _id: -1 });

        let nextTokenNum = 1;
        if (lastVisit && lastVisit.op_token) {
            const numPart = parseInt(lastVisit.op_token.replace(deptCode, ''), 10);
            if (!isNaN(numPart)) {
                nextTokenNum = numPart + 1;
            }
        }
        const op_token = `${deptCode}${String(nextTokenNum).padStart(3, '0')}`;
        const visit_time = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

        const visit = await Visit.create({
            patient_id,
            doctor_id,
            op_token,
            visit_date: today,
            visit_time,
            consultation_fee: Math.max(0, Number(consultation_fee) || 0),
            payment_status: 'Paid',
            payment_method: payment_method || 'Cash',
            notes: notes ? String(notes).slice(0, 500) : '',
            status: 'Waiting'
        });

        res.status(201).json({
            message: 'Visit created successfully',
            visitId: visit._id.toString(),
            op_token
        });

    } catch (error) {
        console.error('Error creating visit:', error);
        res.status(500).json({ message: 'Server error creating visit' });
    }
};

// @desc    Add or Update Vitals for a Visit
// @route   POST /api/visits/:id/vitals
// @access  Private (Reception, Doctor, Admin)
const addVitals = async (req, res) => {
    try {
        const visit_id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(visit_id)) {
            return res.status(400).json({ message: 'Invalid visit ID' });
        }

        let { heart_rate, blood_pressure, temperature, height, weight, spo2, respiratory_rate } = req.body;

        const numHeight = height !== '' && height !== null && height !== undefined ? Number(height) : null;
        const numWeight = weight !== '' && weight !== null && weight !== undefined ? Number(weight) : null;

        // Calculate BMI
        let bmi = null;
        if (numHeight && numWeight && numHeight > 0) {
            const heightInMeters = numHeight / 100;
            bmi = Number((numWeight / (heightInMeters * heightInMeters)).toFixed(2));
        }

        const vitals = await Vitals.findOneAndUpdate(
            { visit_id },
            {
                visit_id,
                heart_rate: heart_rate ? String(heart_rate).slice(0, 20) : null,
                blood_pressure: blood_pressure ? String(blood_pressure).slice(0, 20) : null,
                temperature: temperature ? String(temperature).slice(0, 20) : null,
                height: numHeight,
                weight: numWeight,
                bmi,
                spo2: spo2 ? String(spo2).slice(0, 20) : null,
                respiratory_rate: respiratory_rate ? String(respiratory_rate).slice(0, 20) : null
            },
            { upsert: true, new: true }
        );

        res.json({ message: 'Vitals saved successfully', bmi });

    } catch (error) {
        console.error('Error saving vitals:', error);
        res.status(500).json({ message: 'Server error saving vitals' });
    }
};

// @desc    Get Today's Visits (for Reception Dashboard)
// @route   GET /api/visits/today
// @access  Private
const getTodayVisits = async (req, res) => {
    try {
        const today = getISTDate();
        const visits = await Visit.find({ visit_date: today })
            .populate('patient_id')
            .populate({
                path: 'doctor_id',
                populate: { path: 'department_id' }
            })
            .sort({ visit_time: -1, created_at: -1 });

        const formatted = visits.map(v => {
            const patient = v.patient_id;
            const doctor = v.doctor_id;
            const dept = doctor ? doctor.department_id : null;

            return {
                id: v._id.toString(),
                _id: v._id.toString(),
                patient_id: patient ? patient._id.toString() : null,
                doctor_id: doctor ? doctor._id.toString() : null,
                op_token: v.op_token,
                visit_date: v.visit_date,
                visit_time: v.visit_time,
                consultation_fee: v.consultation_fee,
                payment_status: v.payment_status,
                payment_method: v.payment_method,
                notes: v.notes,
                status: v.status,
                patient_name: patient ? patient.name : 'Unknown',
                patient_code: patient ? patient.patient_id : '',
                mobile_number: patient ? patient.mobile_number : '',
                doctor_name: doctor ? doctor.doctor_name : '',
                department_name: dept ? dept.name : (doctor ? doctor.specialization : '')
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching today visits:', error);
        res.status(500).json({ message: 'Server error retrieving today visits' });
    }
};

module.exports = { createVisit, addVitals, getTodayVisits };

module.exports = { createVisit, addVitals, getTodayVisits };
