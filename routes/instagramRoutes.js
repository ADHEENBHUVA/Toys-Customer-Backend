const express = require('express');
const router = express.Router();
const instagramController = require('../controllers/instagramController');

// Public route to get active Instagram feed items
router.get('/', instagramController.getActiveFeed);

module.exports = router;

