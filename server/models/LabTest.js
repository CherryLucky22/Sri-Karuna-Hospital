const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    category: {
        type: String,
        trim: true,
        default: 'General'
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    normal_range: {
        type: String,
        default: ''
    },
    unit: {
        type: String,
        default: ''
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

module.exports = mongoose.model('LabTest', labTestSchema);
