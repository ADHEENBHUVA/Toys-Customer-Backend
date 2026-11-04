const mongoose = require('mongoose');

const instagramFeedSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        trim: true
    },
    shortcode: {
        type: String,
        trim: true
    },
    mediaType: {
        type: String,
        enum: ['reel', 'post', 'video'],
        default: 'reel'
    },
    title: {
        type: String,
        trim: true,
        default: ''
    },
    caption: {
        type: String,
        trim: true,
        default: ''
    },
    thumbnailUrl: {
        type: String,
        trim: true,
        default: ''
    },
    videoUrl: {
        type: String,
        trim: true,
        default: ''
    },
    likes: {
        type: String,
        default: '1.2K'
    },
    comments: {
        type: String,
        default: '42'
    },
    views: {
        type: String,
        default: '10.5K'
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('InstagramFeed', instagramFeedSchema);

