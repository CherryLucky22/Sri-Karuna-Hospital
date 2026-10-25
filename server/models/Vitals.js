const mongoose = require('mongoose');

const vitalsSchema = new mongoose.Schema({
    visit_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visit',
        required: true,
        unique: true
    },
    heart_rate: {
        type: String,
        default: null
    },
    blood_pressure: {
        type: String,
        default: null
    },
    temperature: {
        type: String,
        default: null
    },
    height: {
        type: Number,
        default: null
    },
    weight: {
        type: Number,
        default: null
    },
    bmi: {
        type: Number,
        default: null
    },
    spo2: {
        type: String,
        default: null
    },
    respiratory_rate: {
        type: String,
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

module.exports = mongoose.model('Vitals', vitalsSchema);
