const mongoose = require('mongoose');

const websiteSettingsSchema = new mongoose.Schema({
    websiteName: { type: String, default: 'Toys Portal' },
    logo: { type: String },
    favicon: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    address: { type: String },
    socialLinks: {
        facebook: String,
        instagram: String,
        youtube: String,
        twitter: String
    },
    currency: { type: String, default: 'USD' },
    currencySymbol: { type: String, default: '$' },
    seo: {
        title: String,
        metaDescription: String,
        keywords: String,
        openGraphImage: String
    },
    discountDisplayType: {
        type: String,
        enum: ['amount', 'percentage'],
        default: 'amount'
    },
    featuredVideoUrl: { type: String },
    featuredVideoThumbnail: { type: String },
    instagramWidgetCode: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('WebsiteSettings', websiteSettingsSchema);
