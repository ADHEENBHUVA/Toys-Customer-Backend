const express = require('express');
const router = express.Router();
const { getAllCollections } = require('../controllers/collectionController');

router.get('/', getAllCollections);

module.exports = router;
