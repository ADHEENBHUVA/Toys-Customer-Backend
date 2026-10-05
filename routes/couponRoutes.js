const router = require('express').Router();
const { validateCoupon } = require('../controllers/couponController');

router.post('/validate', validateCoupon);

module.exports = router;
