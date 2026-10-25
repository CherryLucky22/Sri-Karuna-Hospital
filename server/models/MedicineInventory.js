const mongoose = require('mongoose');

const medicineInventorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        trim: true,
        default: 'General'
    },
    manufacturer: {
        type: String,
        trim: true,
        default: ''
    },
    batch_number: {
        type: String,
        trim: true,
        default: ''
    },
    expiry_date: {
        type: String,
        default: null
    },
    mrp: {
        type: Number,
        required: true,
        default: 0
    },
    selling_price: {
        type: Number,
        required: true,
        default: 0
    },
    current_stock: {
        type: Number,
        required: true,
        default: 0
    },
    minimum_stock: {
        type: Number,
        default: 10
    },
    rack_number: {
        type: String,
        default: ''
    },
    barcode: {
        type: String,
        default: null
    },
    unit: {
        type: String,
        default: 'Tablet'
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

module.exports = mongoose.model('MedicineInventory', medicineInventorySchema);
