const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String
    },
    picture: {
        type: String
    },
    provider: {
        type: String, // 'google.com' or 'apple.com' or 'password'
        default: 'password'
    },
    role: {
        type: String,
        default: 'customer'
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
