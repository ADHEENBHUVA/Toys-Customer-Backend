const mongoose = require('mongoose');

const shippingSettingsSchema = new mongoose.Schema({
    baseShippingCharge: { type: Number, default: 50 },
    isFreeShippingActive: { type: Boolean, default: true },
    freeShippingMinAmount: { type: Number, default: 1000 },
    freeShippingMinItems: { type: Number, default: 0 }, // 0 means no restriction
}, { timestamps: true });

module.exports = mongoose.model('ShippingSettings', shippingSettingsSchema);
