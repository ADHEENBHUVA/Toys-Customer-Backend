const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    image: { type: String },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
