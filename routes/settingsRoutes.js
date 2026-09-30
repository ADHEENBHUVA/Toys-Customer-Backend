const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Public route to get settings (no auth required so footer can display links for non-logged in users)
router.get('/', settingsController.getSettings);

module.exports = router;
