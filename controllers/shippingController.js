const ShippingSettings = require('../models/ShippingSettings');

// Get Shipping Settings for Customer Frontend
exports.getShippingSettings = async (req, res) => {
    try {
        let settings = await ShippingSettings.findOne();
        if (!settings) {
            settings = {
                baseShippingCharge: 50,
                isFreeShippingActive: true,
                freeShippingMinAmount: 1000,
                freeShippingMinItems: 0
            };
        }
        res.status(200).json(settings);
    } catch (error) {
        console.error("Error getting shipping settings:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
