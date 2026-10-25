const bcrypt = require('bcrypt');
const {
    User,
    Department,
    Doctor,
    LabTest,
    MedicineInventory
} = require('./models');

const seedDatabase = async () => {
    try {
        console.log('Checking database seed status...');

        // 1. Departments
        const deptCount = await Department.countDocuments();
        let gmDept, entDept, derDept;

        if (deptCount === 0) {
            console.log('Seeding departments...');
            gmDept = await Department.create({
                name: 'General Medicine',
                code: 'GM',
                description: 'General Physicians'
            });
            entDept = await Department.create({
                name: 'ENT',
                code: 'ENT',
                description: 'Ear, Nose, and Throat'
            });
            derDept = await Department.create({
                name: 'Dermatology',
                code: 'DER',
                description: 'Skin and Hair Specialists'
            });
            console.log('Departments seeded.');
        } else {
            gmDept = await Department.findOne({ code: 'GM' });
            entDept = await Department.findOne({ code: 'ENT' });
            derDept = await Department.findOne({ code: 'DER' });
        }

        // 2. Users & Doctors
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            console.log('Seeding users and doctors...');
            const salt = await bcrypt.genSalt(10);
            const defaultHashedPassword = await bcrypt.hash('password123', salt);

            // Admin
            await User.create({
                name: 'Super Admin',
                email: 'admin@karuna.com',
                password: defaultHashedPassword,
                role: 'Admin',
                phone: '9876543210'
            });

            // Reception
            await User.create({
                name: 'Receptionist 1',
                email: 'reception@karuna.com',
                password: defaultHashedPassword,
                role: 'Reception',
                phone: '9876543211'
            });

            // Doctor 1: Dr Naveen
            const doc1User = await User.create({
                name: 'Dr. N. Naveen Kumar',
                email: 'naveen@karuna.com',
                password: defaultHashedPassword,
                role: 'Doctor',
                phone: '9876543212'
            });
            await Doctor.create({
                user_id: doc1User._id,
                doctor_name: 'Dr. N. Naveen Kumar',
                department_id: gmDept ? gmDept._id : null,
                qualifications: 'MBBS, DNB (General Medicine)',
                specialization: 'General Physician',
                consultation_fee: 500.00
            });

            // Doctor 2: Dr Laxman
            const doc2User = await User.create({
                name: 'Dr. B. Laxman',
                email: 'laxman@karuna.com',
                password: defaultHashedPassword,
                role: 'Doctor',
                phone: '9876543213'
            });
            await Doctor.create({
                user_id: doc2User._id,
                doctor_name: 'Dr. B. Laxman',
                department_id: entDept ? entDept._id : null,
                qualifications: 'M.S. (ENT)',
                specialization: 'ENT Specialist',
                consultation_fee: 600.00
            });

            // Doctor 3: Dr Sruthi
            const doc3User = await User.create({
                name: 'Dr. K. Sruthi',
                email: 'sruthi@karuna.com',
                password: defaultHashedPassword,
                role: 'Doctor',
                phone: '9876543214'
            });
            await Doctor.create({
                user_id: doc3User._id,
                doctor_name: 'Dr. K. Sruthi',
                department_id: derDept ? derDept._id : null,
                qualifications: 'MBBS, MD (DVL)',
                specialization: 'Dermatologist',
                consultation_fee: 600.00
            });

            // Laboratory Tech
            await User.create({
                name: 'Lab Tech',
                email: 'lab@karuna.com',
                password: defaultHashedPassword,
                role: 'Laboratory',
                phone: '9876543215'
            });

            await User.create({
                name: 'Lab Technician',
                email: 'lab@srikarunahospital.com',
                password: defaultHashedPassword,
                role: 'Laboratory',
                phone: '9999999999'
            });

            // Pharmacy
            await User.create({
                name: 'Pharmacist',
                email: 'pharmacy@karuna.com',
                password: defaultHashedPassword,
                role: 'Pharmacy',
                phone: '9876543216'
            });

            // Walk-in dummy doctor & user
            const walkinUser = await User.create({
                name: 'Walk-in System',
                email: 'walkin@sys.com',
                password: defaultHashedPassword,
                role: 'Reception',
                phone: '0000000000'
            });
            await Doctor.create({
                user_id: walkinUser._id,
                doctor_name: 'Self / Walk-in',
                department_id: gmDept ? gmDept._id : null,
                qualifications: '-',
                specialization: '-',
                consultation_fee: 0.00
            });

            console.log('Users and doctors seeded.');
        }

        // 3. Lab Tests
        const labCount = await LabTest.countDocuments();
        if (labCount === 0) {
            console.log('Seeding lab tests...');
            await LabTest.insertMany([
                { name: 'Complete Blood Count (CBC)', category: 'Hematology', price: 450.00, normal_range: 'WBC: 4000-11000, RBC: 4.5-5.5', unit: 'cells/mcL' },
                { name: 'Fasting Blood Sugar (FBS)', category: 'Biochemistry', price: 150.00, normal_range: '70-100', unit: 'mg/dL' },
                { name: 'Lipid Profile', category: 'Biochemistry', price: 800.00, normal_range: 'Cholesterol < 200, Triglycerides < 150', unit: 'mg/dL' },
                { name: 'Liver Function Test (LFT)', category: 'Biochemistry', price: 900.00, normal_range: 'Bilirubin: 0.1-1.2', unit: 'mg/dL' },
                { name: 'Thyroid Profile (T3, T4, TSH)', category: 'Endocrinology', price: 600.00, normal_range: 'TSH: 0.4-4.0', unit: 'mIU/L' },
                { name: 'X-Ray Chest PA View', category: 'Radiology', price: 350.00, normal_range: 'Normal Study', unit: '-' }
            ]);
            console.log('Lab tests seeded.');
        }

        // 4. Medicine Inventory
        const medCount = await MedicineInventory.countDocuments();
        if (medCount === 0) {
            console.log('Seeding medicine inventory...');
            await MedicineInventory.insertMany([
                { name: 'Paracetamol 500mg', category: 'Tablet', manufacturer: 'GSK', expiry_date: '2026-12-31', mrp: 20.00, selling_price: 18.00, current_stock: 500, minimum_stock: 100, unit: 'Tablet' },
                { name: 'Azithromycin 500mg', category: 'Tablet', manufacturer: 'Cipla', expiry_date: '2026-10-31', mrp: 120.00, selling_price: 110.00, current_stock: 200, minimum_stock: 50, unit: 'Tablet' },
                { name: 'Pantoprazole 40mg', category: 'Tablet', manufacturer: 'Sun Pharma', expiry_date: '2027-01-31', mrp: 85.00, selling_price: 80.00, current_stock: 300, minimum_stock: 100, unit: 'Tablet' },
                { name: 'Cetirizine 10mg', category: 'Tablet', manufacturer: 'Dr. Reddys', expiry_date: '2026-11-30', mrp: 40.00, selling_price: 35.00, current_stock: 400, minimum_stock: 100, unit: 'Tablet' },
                { name: 'Cough Syrup', category: 'Syrup', manufacturer: 'Dabur', expiry_date: '2025-12-31', mrp: 110.00, selling_price: 100.00, current_stock: 150, minimum_stock: 20, unit: 'Bottle' }
            ]);
            console.log('Medicine inventory seeded.');
        }

        console.log('\x1b[32m✔ MongoDB database seed check complete\x1b[0m');
    } catch (error) {
        console.error('Database seeding error:', error);
    }
};

module.exports = seedDatabase;
