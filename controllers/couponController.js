const Coupon = require('../models/Coupon');

exports.validateCoupon = async (req, res) => {
    try {
        const { code, subTotal } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, message: 'Please provide a coupon code' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid coupon code' });
        }

        if (coupon.status !== 'Active') {
            return res.status(400).json({ success: false, message: 'This coupon is no longer active' });
        }

        const now = new Date();
        if (now < coupon.startDate) {
            return res.status(400).json({ success: false, message: 'This coupon is not yet valid' });
        }
        if (now > coupon.expiryDate) {
            return res.status(400).json({ success: false, message: 'This coupon has expired' });
        }

        if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: 'This coupon usage limit has been reached' });
        }

        if (coupon.minimumOrderAmount && subTotal < coupon.minimumOrderAmount) {
            return res.status(400).json({ success: false, message: `Minimum order amount of ₹${coupon.minimumOrderAmount} required` });
        }

        // We could also check perCustomerLimit here if we have req.user, but often Cart is unauthenticated.
        // If we require login to use coupons with perCustomerLimit, we'd check it here or during checkout.

        let discountAmount = 0;
        if (coupon.discountType === 'Percentage') {
            discountAmount = (subTotal * coupon.discountValue) / 100;
            if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
                discountAmount = coupon.maximumDiscount;
            }
        } else {
            discountAmount = coupon.discountValue;
        }

        // Ensure discount is not more than subtotal
        if (discountAmount > subTotal) {
            discountAmount = subTotal;
        }

        res.json({
            success: true,
            data: {
                code: coupon.code,
                discountAmount,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue
            }
        });

    } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
