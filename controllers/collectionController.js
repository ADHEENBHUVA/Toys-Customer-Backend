const Collection = require('../models/Collection');

exports.getAllCollections = async (req, res) => {
    try {
        const collections = await Collection.find({ status: 'Active' }).sort({ displayOrder: 1, createdAt: -1 }).lean();
        res.status(200).json({ success: true, count: collections.length, data: collections });
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
