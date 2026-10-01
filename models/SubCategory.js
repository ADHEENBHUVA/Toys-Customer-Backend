const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String, trim: true },
    image: { type: String },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('SubCategory', subCategorySchema);
