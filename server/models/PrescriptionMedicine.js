const mongoose = require('mongoose');

const prescriptionMedicineSchema = new mongoose.Schema({
    prescription_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription',
        required: true
    },
    medicine_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicineInventory',
        default: null
    },
    medicine_name: {
        type: String,
        required: true,
        trim: true
    },
    dosage: {
        type: String,
        default: ''
    },
    morning: {
        type: Boolean,
        default: false
    },
    afternoon: {
        type: Boolean,
        default: false
    },
    night: {
        type: Boolean,
        default: false
    },
    before_food: {
        type: Boolean,
        default: false
    },
    after_food: {
        type: Boolean,
        default: false
    },
    duration: {
        type: Number,
        default: null
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.id = ret._id.toString();
            delete ret.__v;
            return ret;
        }
    },
    toObject: {
        virtuals: true,
        transform: (doc, ret) => {
            ret.id = ret._id.toString();
            delete ret.__v;
            return ret;
        }
    }
});

module.exports = mongoose.model('PrescriptionMedicine', prescriptionMedicineSchema);
