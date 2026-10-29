const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User, Doctor, Department, Visit, Patient, PharmacyBill } = require('../models');

// Helper to get formatted date string in IST
const getISTDate = (daysAgo = 0) => {
    const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - daysAgo * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
};

const VALID_ROLES = ['Admin', 'Reception', 'Doctor', 'Laboratory', 'Pharmacy'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getAdminDashboardStats = async (req, res) => {
    try {
        const today = getISTDate(0);
        const sevenDaysAgo = getISTDate(7);

        // Today's Stats
        const todaysOP = await Visit.countDocuments({ visit_date: today });

        const todaysRevenueAgg = await Visit.aggregate([
            { $match: { visit_date: today } },
            { $group: { _id: null, total: { $sum: '$consultation_fee' } } }
        ]);
        const todaysRevenue = todaysRevenueAgg[0]?.total || 0;

        const todaysPharmacyAgg = await PharmacyBill.aggregate([
            { $match: { bill_date: today } },
            { $group: { _id: null, total: { $sum: '$net_amount' } } }
        ]);
        const todaysPharmacySales = todaysPharmacyAgg[0]?.total || 0;

        // Total Stats
        const totalPatients = await Patient.countDocuments();
        const totalDoctors = await Doctor.countDocuments();

        const totalRevenueAgg = await Visit.aggregate([
            { $group: { _id: null, total: { $sum: '$consultation_fee' } } }
        ]);
        const totalRevenue = totalRevenueAgg[0]?.total || 0;

        const totalPharmacyAgg = await PharmacyBill.aggregate([
            { $group: { _id: null, total: { $sum: '$net_amount' } } }
        ]);
        const totalPharmacySales = totalPharmacyAgg[0]?.total || 0;

        // Department Wise Patients (for Chart)
        const deptPatients = await Visit.aggregate([
            {
                $lookup: {
                    from: 'doctors',
                    localField: 'doctor_id',
                    foreignField: '_id',
                    as: 'doctor'
                }
            },
            { $unwind: '$doctor' },
            {
                $lookup: {
                    from: 'departments',
                    localField: 'doctor.department_id',
                    foreignField: '_id',
                    as: 'department'
                }
            },
            { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ['$department.name', '$doctor.specialization'] },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: { $ifNull: ['$_id', 'General'] },
                    count: 1
                }
            }
        ]);

        // Daily OP Trend (last 7 days)
        const dailyOP = await Visit.aggregate([
            { $match: { visit_date: { $gte: sevenDaysAgo } } },
            { $group: { _id: '$visit_date', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: '$_id', count: 1 } }
        ]);

        // Daily Revenue Trend (last 7 days)
        const dailyRevenue = await Visit.aggregate([
            { $match: { visit_date: { $gte: sevenDaysAgo } } },
            { $group: { _id: '$visit_date', revenue: { $sum: '$consultation_fee' } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: '$_id', revenue: 1 } }
        ]);

        res.json({
            stats: {
                todaysOP,
                todaysRevenue: (parseFloat(todaysRevenue) || 0) + (parseFloat(todaysPharmacySales) || 0),
                todaysPharmacySales: parseFloat(todaysPharmacySales) || 0,
                totalPatients,
                totalDoctors,
                totalRevenue: (parseFloat(totalRevenue) || 0) + (parseFloat(totalPharmacySales) || 0)
            },
            charts: {
                deptPatients,
                dailyOP,
                dailyRevenue
            }
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ message: 'Server error retrieving dashboard stats' });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ created_at: -1 });
        const doctors = await Doctor.find();
        const docMap = new Map();
        doctors.forEach(d => {
            if (d.user_id) docMap.set(d.user_id.toString(), d);
        });

        const usersWithDocInfo = users.map(u => {
            const doc = docMap.get(u._id.toString());
            return {
                id: u._id.toString(),
                name: u.name,
                email: u.email,
                role: u.role,
                phone: u.phone,
                created_at: u.created_at,
                specialization: doc ? doc.specialization : null,
                consultation_fee: doc ? doc.consultation_fee : null
            };
        });

        res.json(usersWithDocInfo);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error retrieving users' });
    }
};

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private (Admin)
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, phone, specialization, consultation_fee } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Name, email, password, and role are required' });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        if (!EMAIL_REGEX.test(cleanEmail)) {
            return res.status(400).json({ message: 'Invalid email address format' });
        }

        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        if (String(password).length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const existing = await User.findOne({ email: cleanEmail });
        if (existing) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const newUser = new User({
            name: String(name).trim(),
            email: cleanEmail,
            password: String(password).trim(),
            role,
            phone: phone ? String(phone).trim() : ''
        });

        await newUser.save(); // pre-save hook securely hashes password with bcrypt

        if (role === 'Doctor') {
            const defaultDept = await Department.findOne();
            await Doctor.create({
                user_id: newUser._id,
                doctor_name: newUser.name,
                specialization: specialization || 'General Physician',
                consultation_fee: parseFloat(consultation_fee) || 0,
                department_id: defaultDept ? defaultDept._id : null
            });
        }

        res.status(201).json({ message: 'User created successfully', id: newUser._id.toString() });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error creating user' });
    }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
    try {
        const { name, email, role, phone, password, specialization, consultation_fee } = req.body;
        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = String(name).trim();
        if (email) {
            const cleanEmail = String(email).trim().toLowerCase();
            if (!EMAIL_REGEX.test(cleanEmail)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }
            // Check if email taken by someone else
            const existing = await User.findOne({ email: cleanEmail, _id: { $ne: userId } });
            if (existing) {
                return res.status(400).json({ message: 'Email is already used by another account' });
            }
            user.email = cleanEmail;
        }
        if (role) {
            if (!VALID_ROLES.includes(role)) {
                return res.status(400).json({ message: 'Invalid role' });
            }
            user.role = role;
        }
        if (phone !== undefined) user.phone = String(phone).trim();
        if (password) {
            if (String(password).length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters long' });
            }
            user.password = String(password).trim();
        }

        await user.save();

        if (user.role === 'Doctor') {
            const doc = await Doctor.findOne({ user_id: userId });
            if (doc) {
                if (name) doc.doctor_name = String(name).trim();
                doc.specialization = specialization || doc.specialization || 'General Physician';
                doc.consultation_fee = consultation_fee !== undefined ? parseFloat(consultation_fee) : doc.consultation_fee;
                await doc.save();
            } else {
                const defaultDept = await Department.findOne();
                await Doctor.create({
                    user_id: userId,
                    doctor_name: user.name,
                    specialization: specialization || 'General Physician',
                    consultation_fee: parseFloat(consultation_fee) || 0,
                    department_id: defaultDept ? defaultDept._id : null
                });
            }
        }

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error updating user' });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        if (req.user && req.user.id === userId) {
            return res.status(400).json({ message: 'You cannot delete your own active admin account' });
        }

        await User.findByIdAndDelete(userId);
        await Doctor.deleteMany({ user_id: userId });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error deleting user' });
    }
};

module.exports = { getAdminDashboardStats, getUsers, createUser, updateUser, deleteUser };

module.exports = { getAdminDashboardStats, getUsers, createUser, updateUser, deleteUser };
