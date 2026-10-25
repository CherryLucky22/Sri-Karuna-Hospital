const User = require('./User');
const Department = require('./Department');
const Doctor = require('./Doctor');
const Patient = require('./Patient');
const Visit = require('./Visit');
const Vitals = require('./Vitals');
const Prescription = require('./Prescription');
const PrescriptionMedicine = require('./PrescriptionMedicine');
const MedicineInventory = require('./MedicineInventory');
const PharmacyBill = require('./PharmacyBill');
const PharmacyBillItem = require('./PharmacyBillItem');
const LabTest = require('./LabTest');
const LabReport = require('./LabReport');

module.exports = {
    User,
    Department,
    Doctor,
    Patient,
    Visit,
    Vitals,
    Prescription,
    PrescriptionMedicine,
    MedicineInventory,
    PharmacyBill,
    PharmacyBillItem,
    LabTest,
    LabReport
};
