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
        const endOfExpiryDate = new Date(coupon.expiryDate);
        endOfExpiryDate.setHours(23, 59, 59, 999);
        
        if (now < coupon.startDate) {
            return res.status(400).json({ success: false, message: 'This coupon is not yet valid' });
        }
        if (now > endOfExpiryDate) {
            return res.status(400).json({ success: false, message: 'This coupon has expired' });
        }

        if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: 'This coupon usage limit has been reached' });
        }

        if (coupon.minimumOrderAmount && subTotal < coupon.minimumOrderAmount) {
            return res.status(400).json({ success: false, message: `Minimum order amount of ₹${coupon.minimumOrderAmount} required` });
        }

        // Check perCustomerLimit if Authorization header exists
        let userId = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const jwt = require('jsonwebtoken');
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_temporary_jwt_secret_change_me');
                userId = decoded.user ? decoded.user.id : decoded.id;
            } catch (err) {
                // Ignore invalid tokens for validation
            }
        }
        
        if (userId && coupon.perCustomerLimit > 0) {
            const timesUsedByUser = coupon.usedBy.filter(u => u.user && u.user.toString() === userId).length;
            if (timesUsedByUser >= coupon.perCustomerLimit) {
                return res.status(400).json({ success: false, message: 'You have already used this coupon' });
            }
        }

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
