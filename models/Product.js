const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: false },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },

    description: { type: String },
    shortDescription: { type: String },

    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    discountPercentage: { type: Number, min: 0, max: 100 },

    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    minimumStockAlert: { type: Number, default: 5 },

    images: [{ type: String }],
    thumbnailImage: { type: String },

    ageGroup: [{ type: String }],
    gender: { type: String, enum: ['Boys', 'Girls', 'Unisex'], default: 'Unisex' },
    toyType: { type: String },
    material: { type: String },
    color: { type: String },
    size: { type: String },
    weight: { type: Number },
    dimensions: {
        length: Number,
        width: Number,
        height: Number
    },

    manufacturer: { type: String },
    countryOfOrigin: { type: String },
    safetyInformation: { type: String },

    status: { type: String, enum: ['Active', 'Inactive', 'Draft', 'Out of Stock'], default: 'Draft' },

    featuredProduct: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
