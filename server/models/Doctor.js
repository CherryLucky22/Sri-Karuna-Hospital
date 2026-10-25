const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctor_name: {
        type: String,
        required: true,
        trim: true
    },
    department_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    qualifications: {
        type: String,
        trim: true,
        default: ''
    },
    specialization: {
        type: String,
        trim: true,
        default: 'General Physician'
    },
    consultation_fee: {
        type: Number,
        required: true,
        default: 0
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

module.exports = mongoose.model('Doctor', doctorSchema);
