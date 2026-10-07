const express = require('express');
const router = express.Router();
// We'll reuse the model from Admin Backend or just redefine a simple one for fetching
const mongoose = require('mongoose');

const promoMediaSchema = new mongoose.Schema({
    type: String,
    title: String,
    subtitle: String,
    mediaUrl: String,
    link: String,
    order: Number,
    isActive: Boolean
});

// Since the DB is shared, we can access the 'promomedias' collection
const PromoMedia = mongoose.models.PromoMedia || mongoose.model('PromoMedia', promoMediaSchema);

// GET all active promo media for the customer frontend
router.get('/', async (req, res) => {
    try {
        const media = await PromoMedia.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(media);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
