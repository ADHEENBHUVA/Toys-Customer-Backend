const mongoose = require('mongoose');

const contactEnquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    internalNotes: { type: String },
    status: { type: String, enum: ['New', 'In Progress', 'Resolved'], default: 'New' }
}, { timestamps: true });

module.exports = mongoose.model('ContactEnquiry', contactEnquirySchema);
