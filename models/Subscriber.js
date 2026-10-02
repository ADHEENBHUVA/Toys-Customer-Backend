const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    status: {
        type: String,
        enum: ['subscribed', 'unsubscribed'],
        default: 'subscribed'
    }
}, { timestamps: true });

module.exports = mongoose.model('Subscriber', subscriberSchema);
