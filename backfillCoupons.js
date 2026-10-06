const mongoose = require('mongoose');
const Coupon = require('./models/Coupon');
const Order = require('./models/Order');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    const orders = await Order.find({ discountAmount: { $gt: 0 } });
    console.log('Found orders with discount:', orders.length);

    const coupon = await Coupon.findOne({ code: 'ABC' });
    if (!coupon) {
      console.log('Coupon ABC not found');
      process.exit(0);
    }

    let updatedCount = 0;
    for (let order of orders) {
        // check if order already in usedBy
        const alreadyAdded = coupon.usedBy.some(u => u.orderId && u.orderId.toString() === order._id.toString());
        if (!alreadyAdded) {
            coupon.usedBy.push({
                user: order.customer,
                usedAt: order.createdAt,
                orderId: order._id
            });
            
            // Also update the order with the couponCode so we have it for future
            order.couponCode = 'ABC';
            await order.save();
            
            updatedCount++;
        }
    }
    if (updatedCount > 0) await coupon.save();
    console.log('Done, backfilled', updatedCount, 'orders into coupon ABC');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
