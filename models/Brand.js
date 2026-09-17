const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    logo: { type: String },
    description: { type: String, trim: true },
    website: { type: String },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);
