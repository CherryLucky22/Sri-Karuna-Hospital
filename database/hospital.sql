-- Sri Karuna Hospitals Database Schema

CREATE DATABASE IF NOT EXISTS hospital_management;
USE hospital_management;

-- 1. Users Table (Admin, Reception, Doctor, Laboratory, Pharmacy)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Reception', 'Doctor', 'Laboratory', 'Pharmacy') NOT NULL,
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- General Medicine, ENT, Dermatology
    code VARCHAR(10) NOT NULL UNIQUE, -- GM, ENT, DER
    description TEXT
);

-- 3. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    qualifications VARCHAR(255),
    specialization VARCHAR(100),
    consultation_fee DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- 4. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(20) UNIQUE NOT NULL, -- SKH000001
    name VARCHAR(100) NOT NULL,
    age INT,
    gender ENUM('Male', 'Female', 'Other'),
    dob DATE,
    blood_group VARCHAR(5),
    mobile_number VARCHAR(15) NOT NULL,
    alternative_mobile VARCHAR(15),
    address TEXT,
    village VARCHAR(100),
    city VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    occupation VARCHAR(100),
    emergency_contact VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Visits Table (OP Registrations)
CREATE TABLE IF NOT EXISTS visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    op_token VARCHAR(20) NOT NULL, -- GM001
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    consultation_fee DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('Pending', 'Paid') DEFAULT 'Pending',
    payment_method ENUM('Cash', 'UPI', 'Card') DEFAULT 'Cash',
    notes TEXT,
    status ENUM('Waiting', 'Completed', 'Cancelled') DEFAULT 'Waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- 6. Vitals Table
CREATE TABLE IF NOT EXISTS vitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL,
    heart_rate VARCHAR(20),
    blood_pressure VARCHAR(20),
    temperature VARCHAR(20),
    height DECIMAL(5, 2), -- in cm
    weight DECIMAL(5, 2), -- in kg
    bmi DECIMAL(5, 2),
    spo2 VARCHAR(20),
    respiratory_rate VARCHAR(20),
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

-- 7. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL,
    chief_complaint TEXT,
    history TEXT,
    clinical_findings TEXT,
    diagnosis TEXT,
    advice TEXT,
    follow_up_date DATE,
    status ENUM('Pending', 'Billed') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

-- 8. Medicines Inventory Table
CREATE TABLE IF NOT EXISTS medicine_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    manufacturer VARCHAR(150),
    batch_number VARCHAR(50),
    expiry_date DATE NOT NULL,
    mrp DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    minimum_stock INT NOT NULL DEFAULT 10,
    rack_number VARCHAR(20),
    barcode VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Prescription Medicines Table
CREATE TABLE IF NOT EXISTS prescription_medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT NOT NULL,
    medicine_id INT, -- Can be null if it's a generic text prescription
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(50),
    morning BOOLEAN DEFAULT FALSE,
    afternoon BOOLEAN DEFAULT FALSE,
    night BOOLEAN DEFAULT FALSE,
    before_food BOOLEAN DEFAULT FALSE,
    after_food BOOLEAN DEFAULT FALSE,
    duration INT, -- in days
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicine_inventory(id) ON DELETE SET NULL
);

-- 10. Pharmacy Bills Table
CREATE TABLE IF NOT EXISTS pharmacy_bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT, -- Can be null for direct sales
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    bill_date DATE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    gst DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('Cash', 'UPI', 'Card') DEFAULT 'Cash',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
);

-- 11. Pharmacy Bill Items Table
CREATE TABLE IF NOT EXISTS pharmacy_bill_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    medicine_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES pharmacy_bills(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicine_inventory(id) ON DELETE CASCADE
);

-- 12. Lab Tests Table
CREATE TABLE IF NOT EXISTS lab_tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    normal_range VARCHAR(255),
    unit VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Prescribed Lab Tests (Reports) Table
CREATE TABLE IF NOT EXISTS lab_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_id INT NOT NULL,
    test_id INT NOT NULL,
    result_value VARCHAR(255),
    remarks TEXT,
    status ENUM('Pending', 'Completed') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES lab_tests(id) ON DELETE CASCADE
);

-- Seed Lab Tests Data
INSERT IGNORE INTO lab_tests (name, category, price, normal_range, unit) VALUES
('Complete Blood Count (CBC)', 'Hematology', 450.00, 'WBC: 4000-11000, RBC: 4.5-5.5', 'cells/mcL'),
('Fasting Blood Sugar (FBS)', 'Biochemistry', 150.00, '70-100', 'mg/dL'),
('Lipid Profile', 'Biochemistry', 800.00, 'Cholesterol < 200, Triglycerides < 150', 'mg/dL'),
('Liver Function Test (LFT)', 'Biochemistry', 900.00, 'Bilirubin: 0.1-1.2', 'mg/dL'),
('Thyroid Profile (T3, T4, TSH)', 'Endocrinology', 600.00, 'TSH: 0.4-4.0', 'mIU/L'),
('X-Ray Chest PA View', 'Radiology', 350.00, 'Normal Study', '-');

-- Seed Laboratory User
INSERT IGNORE INTO users (name, email, password, role, phone) VALUES 
('Lab Technician', 'lab@srikarunahospital.com', '$2b$10$wN9M/8G.m1nNXXyH.jYgV.8CjO9dJ9B0G7H6H8H9H0H1H2H3H4H5H', 'Laboratory', '9999999999');

-- Seed Initial Data
INSERT INTO users (name, email, password, role, phone) VALUES 
('Super Admin', 'admin@karuna.com', 'password123', 'Admin', '9876543210'),
('Receptionist 1', 'reception@karuna.com', 'password123', 'Reception', '9876543211'),
('Dr. N. Naveen Kumar', 'naveen@karuna.com', 'password123', 'Doctor', '9876543212'),
('Dr. B. Laxman', 'laxman@karuna.com', 'password123', 'Doctor', '9876543213'),
('Dr. K. Sruthi', 'sruthi@karuna.com', 'password123', 'Doctor', '9876543214'),
('Lab Tech', 'lab@karuna.com', 'password123', 'Laboratory', '9876543215'),
('Pharmacist', 'pharmacy@karuna.com', 'password123', 'Pharmacy', '9876543216');

INSERT INTO departments (name, code, description) VALUES
('General Medicine', 'GM', 'General Physicians'),
('ENT', 'ENT', 'Ear, Nose, and Throat'),
('Dermatology', 'DER', 'Skin and Hair Specialists');

-- Note: Passwords are plain text 'password123'
-- Doctor IDs: 3 (Naveen), 4 (Laxman), 5 (Sruthi)
-- Department IDs: 1 (GM), 2 (ENT), 3 (DER)

INSERT INTO doctors (user_id, doctor_name, department_id, qualifications, specialization, consultation_fee) VALUES
(3, 'Dr. N. Naveen Kumar', 1, 'MBBS, DNB (General Medicine)', 'General Physician', 500.00),
(4, 'Dr. B. Laxman', 2, 'M.S. (ENT)', 'ENT Specialist', 600.00),
(5, 'Dr. K. Sruthi', 3, 'MBBS, MD (DVL)', 'Dermatologist', 600.00);

-- Initial Medicine Stock
INSERT INTO medicine_inventory (name, category, manufacturer, expiry_date, mrp, selling_price, current_stock, minimum_stock) VALUES
('Paracetamol 500mg', 'Tablet', 'GSK', '2026-12-31', 20.00, 18.00, 500, 100),
('Azithromycin 500mg', 'Tablet', 'Cipla', '2026-10-31', 120.00, 110.00, 200, 50),
('Pantoprazole 40mg', 'Tablet', 'Sun Pharma', '2027-01-31', 85.00, 80.00, 300, 100),
('Cetirizine 10mg', 'Tablet', 'Dr. Reddys', '2026-11-30', 40.00, 35.00, 400, 100),
('Cough Syrup', 'Syrup', 'Dabur', '2025-12-31', 110.00, 100.00, 150, 20);
