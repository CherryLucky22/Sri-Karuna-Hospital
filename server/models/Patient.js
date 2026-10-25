const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    patient_id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        default: null
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', null],
        default: null
    },
    dob: {
        type: String,
        default: null
    },
    blood_group: {
        type: String,
        trim: true,
        default: null
    },
    mobile_number: {
        type: String,
        required: true,
        trim: true
    },
    alternative_mobile: {
        type: String,
        trim: true,
        default: null
    },
    address: {
        type: String,
        trim: true,
        default: null
    },
    village: {
        type: String,
        trim: true,
        default: null
    },
    city: {
        type: String,
        trim: true,
        default: null
    },
    district: {
        type: String,
        trim: true,
        default: null
    },
    state: {
        type: String,
        trim: true,
        default: null
    },
    occupation: {
        type: String,
        trim: true,
        default: null
    },
    emergency_contact: {
        type: String,
        trim: true,
        default: null
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

module.exports = mongoose.model('Patient', patientSchema);
