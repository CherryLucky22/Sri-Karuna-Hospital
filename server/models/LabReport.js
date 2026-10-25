const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
    visit_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visit',
        required: true
    },
    test_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LabTest',
        required: true
    },
    result_value: {
        type: String,
        default: null
    },
    remarks: {
        type: String,
        default: ''
    },
    lab_remarks: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed'],
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

module.exports = mongoose.model('LabReport', labReportSchema);
