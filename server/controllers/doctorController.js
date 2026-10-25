const { Doctor, Visit, Patient, Vitals, Prescription, PrescriptionMedicine, LabReport, LabTest, PharmacyBill, Department } = require('../models');

const getISTDate = (daysAgo = 0) => {
    const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - daysAgo * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
};

// @desc    Get doctor's dashboard info (Today's patients)
// @route   GET /api/doctors/dashboard
// @access  Private (Doctor)
const getDoctorDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const doctor = await Doctor.findOne({ user_id: userId });
        if (!doctor) {
            return res.status(403).json({ message: 'Not authorized as doctor' });
        }
        const doctorId = doctor._id;
        const today = getISTDate(0);

        // Get Visits for today for this doctor
        const visits = await Visit.find({ doctor_id: doctorId, visit_date: today })
            .populate('patient_id')
            .sort({ status: 1, visit_time: 1 });

        // Get Vitals for these visits
        const formattedVisits = [];
        for (const visit of visits) {
            const vitals = await Vitals.findOne({ visit_id: visit._id });
            const p = visit.patient_id;
            formattedVisits.push({
                id: visit._id.toString(),
                _id: visit._id.toString(),
                patient_id: p ? p._id.toString() : null,
                doctor_id: doctorId.toString(),
                op_token: visit.op_token,
                visit_date: visit.visit_date,
                visit_time: visit.visit_time,
                consultation_fee: visit.consultation_fee,
                payment_status: visit.payment_status,
                payment_method: visit.payment_method,
                notes: visit.notes,
                status: visit.status,
                created_at: visit.created_at,
                patient_name: p ? p.name : 'Unknown',
                patient_code: p ? p.patient_id : '',
                age: p ? p.age : null,
                gender: p ? p.gender : null,
                vitals: vitals ? vitals.toObject() : null
            });
        }

        // Hospital-wide stats for today
        const allTodayVisits = await Visit.find({ visit_date: today })
            .populate('patient_id')
            .populate('doctor_id')
            .sort({ created_at: -1 });

        const receptionList = allTodayVisits.map(v => ({
            id: v._id.toString(),
            op_token: v.op_token,
            status: v.status,
            patient_name: v.patient_id ? v.patient_id.name : 'Unknown',
            patient_code: v.patient_id ? v.patient_id.patient_id : '',
            doctor_name: v.doctor_id ? v.doctor_id.doctor_name : '',
            visit_time: v.visit_time,
            consultation_fee: v.consultation_fee,
            payment_method: v.payment_method
        }));

        // Lab reports created today
        const startOfDay = new Date(today + 'T00:00:00.000Z');
        const endOfDay = new Date(today + 'T23:59:59.999Z');
        const todayLabReports = await LabReport.find({
            created_at: { $gte: startOfDay, $lte: endOfDay }
        })
            .populate('test_id')
            .populate({
                path: 'visit_id',
                populate: { path: 'patient_id' }
            })
            .sort({ created_at: -1 });

        const labList = todayLabReports.map(l => ({
            id: l._id.toString(),
            status: l.status,
            created_at: l.created_at,
            test_name: l.test_id ? l.test_id.name : 'Lab Test',
            price: l.test_id ? l.test_id.price : 0,
            patient_name: l.visit_id && l.visit_id.patient_id ? l.visit_id.patient_id.name : 'Unknown',
            payment_method: l.visit_id ? l.visit_id.payment_method : 'Cash'
        }));

        // Pharmacy bills for today
        const todayPharmacyBills = await PharmacyBill.find({ bill_date: today })
            .populate('patient_id')
            .sort({ created_at: -1 });

        const pharmacyList = todayPharmacyBills.map(pb => ({
            bill_number: pb.bill_number,
            total_amount: pb.total_amount,
            net_amount: pb.net_amount,
            discount: pb.discount,
            gst: pb.gst,
            created_at: pb.created_at,
            patient_name: pb.patient_id ? pb.patient_id.name : 'Direct Sale',
            payment_method: pb.payment_method
        }));

        res.json({
            todayTotal: formattedVisits.length,
            waiting: formattedVisits.filter(v => v.status === 'Waiting').length,
            completed: formattedVisits.filter(v => v.status === 'Completed').length,
            patients: formattedVisits,
            hospitalStats: {
                reception: { count: receptionList.length, data: receptionList },
                laboratory: { count: labList.length, data: labList },
                pharmacy: { count: pharmacyList.length, data: pharmacyList }
            }
        });

    } catch (error) {
        console.error('Doctor dashboard error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Save Prescription
// @route   POST /api/doctors/prescribe
// @access  Private (Doctor)
const savePrescription = async (req, res) => {
    try {
        const { visit_id, chief_complaint, history, clinical_findings, diagnosis, advice, follow_up_date, medicines } = req.body;

        const prescription = await Prescription.create({
            visit_id,
            chief_complaint,
            history,
            clinical_findings,
            diagnosis,
            advice,
            follow_up_date: follow_up_date || null
        });

        // Save medicines
        if (medicines && medicines.length > 0) {
            const medDocs = medicines.map(med => ({
                prescription_id: prescription._id,
                medicine_id: med.medicine_id || null,
                medicine_name: med.medicine_name,
                dosage: med.dosage || '',
                morning: !!med.morning,
                afternoon: !!med.afternoon,
                night: !!med.night,
                before_food: !!med.before_food,
                after_food: !!med.after_food,
                duration: med.duration !== '' && med.duration !== null ? Number(med.duration) : null
            }));
            await PrescriptionMedicine.insertMany(medDocs);
        }

        // Update visit status to Completed
        await Visit.findByIdAndUpdate(visit_id, { status: 'Completed' });

        res.status(201).json({
            message: 'Prescription saved successfully',
            prescriptionId: prescription._id.toString()
        });

    } catch (error) {
        console.error('Save prescription error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get complete prescription summary for a visit
// @route   GET /api/doctors/prescription-summary/:visitId
// @access  Private (Doctor)
const getPrescriptionSummary = async (req, res) => {
    try {
        const { visitId } = req.params;

        const prescription = await Prescription.findOne({ visit_id: visitId }).sort({ created_at: -1 });

        if (!prescription) {
            return res.status(404).json({ message: 'No prescription found for this visit' });
        }

        const medicines = await PrescriptionMedicine.find({ prescription_id: prescription._id });

        const labReports = await LabReport.find({ visit_id: visitId }).populate('test_id');
        const formattedLabReports = labReports.map(lr => ({
            id: lr._id.toString(),
            visit_id: lr.visit_id.toString(),
            test_id: lr.test_id ? lr.test_id._id.toString() : null,
            result_value: lr.result_value,
            remarks: lr.remarks,
            lab_remarks: lr.lab_remarks,
            status: lr.status,
            test_name: lr.test_id ? lr.test_id.name : '',
            normal_range: lr.test_id ? lr.test_id.normal_range : '',
            unit: lr.test_id ? lr.test_id.unit : ''
        }));

        const result = prescription.toObject();
        result.medicines = medicines.map(m => m.toObject());
        result.lab_reports = formattedLabReports;

        res.json(result);

    } catch (error) {
        console.error('Prescription summary error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all active doctors for dropdowns
// @route   GET /api/doctors/list
// @access  Private
const getDoctorsList = async (req, res) => {
    try {
        const doctors = await Doctor.find().populate('department_id');
        const formatted = doctors.map(d => ({
            id: d._id.toString(),
            name: d.doctor_name,
            specialization: d.specialization,
            consultation_fee: d.consultation_fee,
            department: d.department_id ? d.department_id.name : d.specialization
        }));
        res.json(formatted);
    } catch (error) {
        console.error('Doctors list error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get hospital analysis (Revenue and Patients)
// @route   GET /api/doctors/analysis
// @access  Private (Doctor)
const getHospitalAnalysis = async (req, res) => {
    try {
        const today = getISTDate(0);
        const [yearStr, monthStr] = today.split('-');
        const currentYear = yearStr;
        const currentMonth = `${yearStr}-${monthStr}`;

        // Compute 7 days ago
        const sevenDaysAgo = getISTDate(7);

        // Compute last month prefix
        const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
        d.setMonth(d.getMonth() - 1);
        const lastMonthStr = d.toISOString().slice(0, 7);

        // Helper to query metrics
        const getStats = async (visitMatch, pharmacyMatch, labMatch) => {
            // Patient count & visit revenue
            const visitAgg = await Visit.aggregate([
                { $match: visitMatch },
                {
                    $group: {
                        _id: null,
                        patients: { $addToSet: '$patient_id' },
                        revenue: { $sum: '$consultation_fee' }
                    }
                },
                {
                    $project: {
                        count: { $size: '$patients' },
                        revenue: 1
                    }
                }
            ]);
            const visitCount = visitAgg[0]?.count || 0;
            const visitRevenue = visitAgg[0]?.revenue || 0;

            // Pharmacy revenue
            const pharmacyAgg = await PharmacyBill.aggregate([
                { $match: pharmacyMatch },
                { $group: { _id: null, revenue: { $sum: '$net_amount' } } }
            ]);
            const pharmacyRevenue = pharmacyAgg[0]?.revenue || 0;

            // Lab revenue
            const labAgg = await LabReport.aggregate([
                { $match: labMatch },
                {
                    $lookup: {
                        from: 'labtests',
                        localField: 'test_id',
                        foreignField: '_id',
                        as: 'test'
                    }
                },
                { $unwind: '$test' },
                { $group: { _id: null, revenue: { $sum: '$test.price' } } }
            ]);
            const labRevenue = labAgg[0]?.revenue || 0;

            return {
                patients: visitCount,
                revenue: (parseFloat(visitRevenue) || 0) + (parseFloat(pharmacyRevenue) || 0) + (parseFloat(labRevenue) || 0)
            };
        };

        const startOfToday = new Date(today + 'T00:00:00.000Z');
        const startOf7Days = new Date(sevenDaysAgo + 'T00:00:00.000Z');
        const startOfMonth = new Date(`${currentMonth}-01T00:00:00.000Z`);
        const startOfLastMonth = new Date(`${lastMonthStr}-01T00:00:00.000Z`);
        const endOfLastMonth = new Date(`${currentMonth}-01T00:00:00.000Z`);
        const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);

        // Daily
        const daily = await getStats(
            { visit_date: today },
            { bill_date: today },
            { created_at: { $gte: startOfToday } }
        );

        // Weekly
        const weekly = await getStats(
            { visit_date: { $gte: sevenDaysAgo } },
            { bill_date: { $gte: sevenDaysAgo } },
            { created_at: { $gte: startOf7Days } }
        );

        // Monthly
        const monthly = await getStats(
            { visit_date: { $regex: `^${currentMonth}` } },
            { bill_date: { $regex: `^${currentMonth}` } },
            { created_at: { $gte: startOfMonth } }
        );

        // Last Month
        const lastMonth = await getStats(
            { visit_date: { $regex: `^${lastMonthStr}` } },
            { bill_date: { $regex: `^${lastMonthStr}` } },
            { created_at: { $gte: startOfLastMonth, $lt: endOfLastMonth } }
        );

        // Yearly
        const yearly = await getStats(
            { visit_date: { $regex: `^${currentYear}` } },
            { bill_date: { $regex: `^${currentYear}` } },
            { created_at: { $gte: startOfYear } }
        );

        // All Time
        const allTime = await getStats({}, {}, {});

        res.json({ daily, weekly, monthly, lastMonth, yearly, allTime });

    } catch (error) {
        console.error('Hospital analysis error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getDoctorDashboard, savePrescription, getDoctorsList, getPrescriptionSummary, getHospitalAnalysis };
