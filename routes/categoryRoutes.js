const express = require('express');
const router = express.Router();
const { getAllCategories, getTopCategories } = require('../controllers/categoryController');

router.get('/top', getTopCategories);
router.get('/', getAllCategories);

module.exports = router;
