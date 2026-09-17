const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Customer Backend: Connected to MongoDB'))
    .catch(err => console.error('Customer Backend: MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.send('Customer Backend is running on Vercel!');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Customer Backend is running' });
});

// Import Routes
const authRoutes = require('./routes/authRoutes');

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/shipping', require('./routes/shippingRoutes'));

app.listen(PORT, () => {
    console.log(`Customer Backend server is running on port ${PORT}`);
});

module.exports = app;
