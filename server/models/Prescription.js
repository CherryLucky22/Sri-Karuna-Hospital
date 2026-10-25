const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    visit_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visit',
        required: true
    },
    chief_complaint: {
        type: String,
        default: ''
    },
    history: {
        type: String,
        default: ''
    },
    clinical_findings: {
        type: String,
        default: ''
    },
    diagnosis: {
        type: String,
        default: ''
    },
    advice: {
        type: String,
        default: ''
    },
    follow_up_date: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['Pending', 'Billed'],
        default: 'Pending'
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

module.exports = mongoose.model('Prescription', prescriptionSchema);
