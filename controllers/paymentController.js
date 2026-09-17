const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

// Initialize Razorpay with the user's provided test keys
const razorpay = new Razorpay({
    key_id: 'rzp_test_TciOZDXIMiQnYr',
    key_secret: 'hctAmjd2yt89l3fN3xDPzCAC'
});

exports.createOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount) {
            return res.status(400).json({ success: false, message: 'Amount is required' });
        }

        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        
        if (!order) {
            return res.status(500).json({ success: false, message: 'Some error occurred with Razorpay' });
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Error creating razorpay order:', error);
        res.status(500).json({ success: false, message: 'Failed to create razorpay order', error: error.message });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderData // Includes customer info, items, address etc.
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', 'hctAmjd2yt89l3fN3xDPzCAC')
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Payment is successful, save order in DB
            
            // Reformat items to match schema if needed
            const orderItems = orderData.items.map(item => ({
                product: item.productId,
                quantity: item.quantity,
                price: item.price,
                discount: 0
            }));

            const newOrder = new Order({
                customer: req.user.id, // from auth middleware
                orderItems: orderItems,
                shippingAddress: orderData.shippingAddress,
                billingAddress: orderData.shippingAddress, // use shipping as billing for now
                paymentMethod: 'Razorpay',
                paymentStatus: 'Paid',
                subTotal: orderData.subTotal,
                taxAmount: 0,
                shippingCharge: orderData.shippingCharge,
                discountAmount: 0,
                totalAmount: orderData.totalAmount,
                orderStatus: 'Confirmed',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id
            });

            await newOrder.save();

            res.json({
                success: true,
                message: 'Payment verified successfully',
                orderId: newOrder._id
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid signature'
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Failed to verify payment', error: error.message });
    }
};
