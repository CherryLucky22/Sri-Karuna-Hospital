const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
    patient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    op_token: {
        type: String,
        required: true,
        trim: true
    },
    visit_date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    visit_time: {
        type: String, // HH:MM:SS
        required: true
    },
    consultation_fee: {
        type: Number,
        required: true,
        default: 0
    },
    payment_status: {
        type: String,
        enum: ['Pending', 'Paid'],
        default: 'Paid'
    },
    payment_method: {
        type: String,
        enum: ['Cash', 'UPI', 'Card'],
        default: 'Cash'
    },
    notes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Waiting', 'Completed', 'Cancelled'],
        default: 'Waiting'
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

module.exports = mongoose.model('Visit', visitSchema);
