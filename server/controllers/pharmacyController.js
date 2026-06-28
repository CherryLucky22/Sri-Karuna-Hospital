const pool = require('../config/db');

// @desc    Get all medicines in inventory
// @route   GET /api/pharmacy/inventory
// @access  Private
const getInventory = async (req, res) => {
    try {
        const [medicines] = await pool.query('SELECT * FROM medicine_inventory ORDER BY name ASC');
        res.json(medicines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Search medicine for billing
// @route   GET /api/pharmacy/search?q=para
// @access  Private
const searchMedicine = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: 'Search query required' });

        const [medicines] = await pool.query(
            `SELECT * FROM medicine_inventory 
             WHERE name LIKE ? OR category LIKE ? OR batch_number LIKE ?
             AND current_stock > 0`,
            [`%${q}%`, `%${q}%`, `%${q}%`]
        );
        res.json(medicines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create Pharmacy Bill
// @route   POST /api/pharmacy/bill
// @access  Private (Pharmacy)
const createBill = async (req, res) => {
    try {
        const { patient_id, prescription_id, total_amount, discount, gst, net_amount, payment_method, items } = req.body;

        // Generate Bill Number
        const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, '');
        const [lastBill] = await pool.query('SELECT bill_number FROM pharmacy_bills ORDER BY id DESC LIMIT 1');
        
        let nextNumber = 1;
        if (lastBill.length > 0) {
            const lastNum = lastBill[0].bill_number.split('-')[1];
            if(lastNum) nextNumber = parseInt(lastNum) + 1;
        }
        const bill_number = `PHM${today}-${nextNumber.toString().padStart(4, '0')}`;

        const todayDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];

        // 1. Create Bill Record
        const [billResult] = await pool.query(
            `INSERT INTO pharmacy_bills 
             (patient_id, bill_number, bill_date, total_amount, discount, gst, net_amount, payment_method) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [patient_id || null, bill_number, todayDate, total_amount, discount, gst, net_amount, payment_method]
        );

        const billId = billResult.insertId;

        // 2. Add Bill Items and Reduce Stock
        for (let item of items) {
            await pool.query(
                `INSERT INTO pharmacy_bill_items 
                 (bill_id, medicine_id, quantity, price, total) 
                 VALUES (?, ?, ?, ?, ?)`,
                [billId, item.medicine_id, item.quantity, item.price, item.total]
            );

            // Reduce stock
            await pool.query(
                `UPDATE medicine_inventory SET current_stock = current_stock - ? WHERE id = ?`,
                [item.quantity, item.medicine_id]
            );
        }

        if (prescription_id) {
            await pool.query('UPDATE prescriptions SET status = ? WHERE id = ?', ['Billed', prescription_id]);
        }

        res.status(201).json({ message: 'Bill generated successfully', billId, bill_number });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get pending prescriptions
// @route   GET /api/pharmacy/pending-prescriptions
// @access  Private (Pharmacy)
const getPendingPrescriptions = async (req, res) => {
    try {
        const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const [prescriptions] = await pool.query(
            `SELECT pr.id, pr.created_at, v.op_token, p.id as patient_id, p.name as patient_name, p.patient_id as patient_code, 
                    d.doctor_name, pr.diagnosis
             FROM prescriptions pr
             JOIN visits v ON pr.visit_id = v.id
             JOIN patients p ON v.patient_id = p.id
             JOIN doctors d ON v.doctor_id = d.id
             WHERE DATE(pr.created_at) = ? AND pr.status = 'Pending'
             ORDER BY pr.created_at DESC`,
            [today]
        );

        // Get medicines for each prescription
        for (let pr of prescriptions) {
            const [medicines] = await pool.query(
                `SELECT pm.*, mi.selling_price as price, mi.current_stock 
                 FROM prescription_medicines pm
                 LEFT JOIN medicine_inventory mi ON pm.medicine_id = mi.id
                 WHERE pm.prescription_id = ?`,
                [pr.id]
            );
            pr.medicines = medicines;
        }

        res.json(prescriptions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add new medicine to inventory
// @route   POST /api/pharmacy/inventory
// @access  Private (Pharmacy)
const addMedicine = async (req, res) => {
    try {
        const { name, category, minimum_stock, selling_price, mrp, current_stock, expiry_date, unit } = req.body;
        
        await pool.query(
            `INSERT INTO medicine_inventory 
             (name, category, minimum_stock, selling_price, mrp, current_stock, expiry_date, unit) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, category, minimum_stock || 10, selling_price, mrp, current_stock || 0, expiry_date || null, unit || 'Tablet']
        );
        
        res.status(201).json({ message: 'Medicine added successfully' });
    } catch (error) {
        console.error(error);
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
        
        await pool.query(
            `UPDATE medicine_inventory 
             SET name=?, category=?, minimum_stock=?, selling_price=?, mrp=?, current_stock=?, expiry_date=?, unit=? 
             WHERE id=?`,
            [name, category, minimum_stock || 10, selling_price, mrp, current_stock || 0, expiry_date || null, unit || 'Tablet', id]
        );
        
        res.json({ message: 'Medicine updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getInventory, searchMedicine, createBill, getPendingPrescriptions, addMedicine, updateMedicine };
