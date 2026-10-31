const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    streetAddress: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true
    },
    zipCode: {
        type: String,
        required: [true, 'Pincode/Zip is required'],
        trim: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    picture: {
        type: String,
        default: ''
    },
    provider: {
        type: String, // 'google.com' or 'apple.com' or 'password'
        default: 'password'
    },
    password: {
        type: String,
        default: null
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpending: {
        type: Number,
        default: 0
    },
    accountStatus: {
        type: String,
        enum: ['Active', 'Inactive', 'Suspended'],
        default: 'Active'
    },
    role: {
        type: String,
        default: 'customer'
    },
    addresses: {
        type: [addressSchema],
        validate: [
            function (val) {
                return !val || val.length <= 5;
            },
            'Customer can only save up to 5 addresses.'
        ],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
