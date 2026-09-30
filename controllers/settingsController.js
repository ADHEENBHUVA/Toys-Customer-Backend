const WebsiteSettings = require('../models/WebsiteSettings');

exports.getSettings = async (req, res) => {
    try {
        const settings = await WebsiteSettings.findOne();
        res.json(settings || {});
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
