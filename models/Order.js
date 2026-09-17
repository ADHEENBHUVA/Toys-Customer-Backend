const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    orderItems: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        discount: { type: Number, default: 0 }
    }],
    shippingAddress: {
        fullName: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
        phone: String
    },
    billingAddress: {
        fullName: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
        phone: String
    },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded', 'Partially Refunded'], default: 'Pending' },

    subTotal: { type: Number, required: true },
    taxAmount: { type: Number, required: true, default: 0 },
    shippingCharge: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },

    orderStatus: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded'],
        default: 'Pending'
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
