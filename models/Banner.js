const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    image: { type: String, required: true },
    platform: { type: String, enum: ['PC', 'Mobile'], default: 'PC' },
    buttonText: { type: String },
    buttonLink: { type: String },
    displayOrder: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
