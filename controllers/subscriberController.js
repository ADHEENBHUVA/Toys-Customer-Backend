const Subscriber = require('../models/Subscriber');

// @desc    Add a new subscriber
// @route   POST /api/subscribers
// @access  Public
exports.createSubscriber = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Check if already subscribed
        const existingSubscriber = await Subscriber.findOne({ email });
        if (existingSubscriber) {
            if (existingSubscriber.status === 'unsubscribed') {
                existingSubscriber.status = 'subscribed';
                await existingSubscriber.save();
                return res.status(200).json({ success: true, message: 'Successfully re-subscribed!' });
            }
            return res.status(400).json({ success: false, message: 'Email is already subscribed' });
        }

        const subscriber = await Subscriber.create({ email });
        res.status(201).json({ success: true, data: subscriber, message: 'Successfully subscribed to newsletter!' });
    } catch (error) {
        console.error('Error creating subscriber:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
