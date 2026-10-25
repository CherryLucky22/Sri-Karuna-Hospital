const { MedicineInventory, PharmacyBill, PharmacyBillItem, Prescription, PrescriptionMedicine, Visit, Patient, Doctor } = require('../models');

const getISTDate = () => {
    const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
};

// @desc    Get all medicines in inventory
// @route   GET /api/pharmacy/inventory
// @access  Private
const getInventory = async (req, res) => {
    try {
        const medicines = await MedicineInventory.find().sort({ name: 1 });
        res.json(medicines);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Search medicine for billing
// @route   GET /api/pharmacy/search?q=para
// @access  Private
const searchMedicine = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: 'Search query required' });

        const regex = new RegExp(q, 'i');
        const medicines = await MedicineInventory.find({
            $and: [
                {
                    $or: [
                        { name: regex },
                        { category: regex },
                        { batch_number: regex }
                    ]
                },
                { current_stock: { $gt: 0 } }
            ]
        });

        res.json(medicines);
    } catch (error) {
        console.error('Error searching medicine:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create Pharmacy Bill
// @route   POST /api/pharmacy/bill
// @access  Private (Pharmacy)
const createBill = async (req, res) => {
    try {
        const { patient_id, prescription_id, total_amount, discount, gst, net_amount, payment_method, items } = req.body;

        const todayDate = getISTDate();
        const dateCode = todayDate.replace(/-/g, '');

        // Generate Bill Number: PHM20261025-0001
        const lastBill = await PharmacyBill.findOne().sort({ created_at: -1, _id: -1 });
        let nextNumber = 1;
        if (lastBill && lastBill.bill_number) {
            const parts = lastBill.bill_number.split('-');
            if (parts.length > 1) {
                const parsed = parseInt(parts[1], 10);
                if (!isNaN(parsed)) nextNumber = parsed + 1;
            }
        }
        const bill_number = `PHM${dateCode}-${String(nextNumber).padStart(4, '0')}`;

        // 1. Create Bill Record
        const bill = await PharmacyBill.create({
            patient_id: patient_id || null,
            bill_number,
            bill_date: todayDate,
            total_amount: Number(total_amount) || 0,
            discount: Number(discount) || 0,
            gst: Number(gst) || 0,
            net_amount: Number(net_amount) || 0,
            payment_method: payment_method || 'Cash'
        });

        // 2. Add Bill Items and Reduce Stock
        if (items && items.length > 0) {
            for (const item of items) {
                await PharmacyBillItem.create({
                    bill_id: bill._id,
                    medicine_id: item.medicine_id,
                    quantity: Number(item.quantity) || 1,
                    price: Number(item.price) || 0,
                    total: Number(item.total) || 0
                });

                // Reduce stock
                await MedicineInventory.findByIdAndUpdate(item.medicine_id, {
                    $inc: { current_stock: -Math.abs(Number(item.quantity) || 1) }
                });
            }
        }

        if (prescription_id) {
            await Prescription.findByIdAndUpdate(prescription_id, { status: 'Billed' });
        }

        res.status(201).json({
            message: 'Bill generated successfully',
            billId: bill._id.toString(),
            bill_number
        });

    } catch (error) {
        console.error('Error creating pharmacy bill:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get pending prescriptions
// @route   GET /api/pharmacy/pending-prescriptions
// @access  Private (Pharmacy)
const getPendingPrescriptions = async (req, res) => {
    try {
        const today = getISTDate();
        const startOfDay = new Date(today + 'T00:00:00.000Z');
        const endOfDay = new Date(today + 'T23:59:59.999Z');

        const prescriptions = await Prescription.find({
            status: 'Pending',
            created_at: { $gte: startOfDay, $lte: endOfDay }
        })
            .populate({
                path: 'visit_id',
                populate: [
                    { path: 'patient_id' },
                    { path: 'doctor_id' }
                ]
            })
            .sort({ created_at: -1 });

        const formatted = [];
        for (const pr of prescriptions) {
            const visit = pr.visit_id;
            const patient = visit ? visit.patient_id : null;
            const doctor = visit ? visit.doctor_id : null;

            // Get medicines for each prescription
            const medicines = await PrescriptionMedicine.find({ prescription_id: pr._id }).populate('medicine_id');
            const formattedMeds = medicines.map(pm => {
                const medInv = pm.medicine_id;
                return {
                    id: pm._id.toString(),
                    _id: pm._id.toString(),
                    prescription_id: pm.prescription_id.toString(),
                    medicine_id: medInv ? medInv._id.toString() : null,
                    medicine_name: pm.medicine_name,
                    dosage: pm.dosage,
                    morning: pm.morning,
                    afternoon: pm.afternoon,
                    night: pm.night,
                    before_food: pm.before_food,
                    after_food: pm.after_food,
                    duration: pm.duration,
                    price: medInv ? medInv.selling_price : 0,
                    current_stock: medInv ? medInv.current_stock : 0
                };
            });

            formatted.push({
                id: pr._id.toString(),
                _id: pr._id.toString(),
                created_at: pr.created_at,
                op_token: visit ? visit.op_token : '',
                patient_id: patient ? patient._id.toString() : null,
                patient_name: patient ? patient.name : 'Unknown',
                patient_code: patient ? patient.patient_id : '',
                doctor_name: doctor ? doctor.doctor_name : '',
                diagnosis: pr.diagnosis,
                medicines: formattedMeds
            });
        }

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching pending prescriptions:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add new medicine to inventory
// @route   POST /api/pharmacy/inventory
// @access  Private (Pharmacy)
const addMedicine = async (req, res) => {
    try {
        const { name, category, minimum_stock, selling_price, mrp, current_stock, expiry_date, unit } = req.body;

        const medicine = await MedicineInventory.create({
            name,
            category: category || 'General',
            minimum_stock: minimum_stock !== undefined ? Number(minimum_stock) : 10,
            selling_price: Number(selling_price) || 0,
            mrp: Number(mrp) || 0,
            current_stock: Number(current_stock) || 0,
            expiry_date: expiry_date || null,
            unit: unit || 'Tablet'
        });

        res.status(201).json({ message: 'Medicine added successfully', id: medicine._id.toString() });
    } catch (error) {
        console.error('Error adding medicine:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update existing medicine in inventory
// @route   PUT /api/pharmacy/inventory/:id
// @access  Private (Pharmacy)
const updateMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, minimum_stock, selling_price, mrp, current_stock, expiry_date, unit } = req.body;

        const medicine = await MedicineInventory.findByIdAndUpdate(
            id,
            {
                name,
                category: category || 'General',
                minimum_stock: minimum_stock !== undefined ? Number(minimum_stock) : 10,
                selling_price: Number(selling_price) || 0,
                mrp: Number(mrp) || 0,
                current_stock: Number(current_stock) || 0,
                expiry_date: expiry_date || null,
                unit: unit || 'Tablet'
            },
            { new: true }
        );

        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        res.json({ message: 'Medicine updated successfully' });
    } catch (error) {
        console.error('Error updating medicine:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getInventory, searchMedicine, createBill, getPendingPrescriptions, addMedicine, updateMedicine };
