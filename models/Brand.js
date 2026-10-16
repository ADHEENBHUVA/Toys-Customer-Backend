const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    logo: { type: String },
    description: { type: String, trim: true },
    website: { type: String },
    shape: { type: String, default: 'squircle' },
    bgColor: { type: String, default: '#FFF0F5' },
    borderColor: { type: String, default: '#FFB6C1' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);
