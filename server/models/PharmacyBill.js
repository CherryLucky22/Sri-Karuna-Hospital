const mongoose = require('mongoose');

const pharmacyBillSchema = new mongoose.Schema({
    patient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        default: null
    },
    bill_number: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    bill_date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    total_amount: {
        type: Number,
        required: true,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    gst: {
        type: Number,
        default: 0
    },
    net_amount: {
        type: Number,
        required: true,
        default: 0
    },
    payment_method: {
        type: String,
        enum: ['Cash', 'UPI', 'Card'],
        default: 'Cash'
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
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

module.exports = mongoose.model('PharmacyBill', pharmacyBillSchema);
