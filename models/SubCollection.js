const mongoose = require('mongoose');

const subCollectionSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    parentCollection: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', required: true },
    description: { type: String, trim: true },
    image: { type: String },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('SubCollection', subCollectionSchema);
