const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Serverless-friendly MongoDB connection helper with connection caching
const connectToDatabase = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not defined in environment variables');
    }
    await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
    });
    console.log('Customer Backend: Connected to MongoDB successfully');
};

// Immediate background connection attempt on startup
connectToDatabase().catch(err => {
    console.error('Customer Backend initial MongoDB connection warning:', err.message);
});

app.get('/', (req, res) => {
    res.send('Customer Backend is running on Vercel!');
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Customer Backend is running',
        dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Middleware to ensure DB connection before executing queries
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (err) {
        console.error('Customer Backend DB Connection Middleware Error:', err);
        return res.status(500).json({ 
            success: false, 
            error: 'Database Connection Error', 
            message: err.message,
            hint: 'Ensure 0.0.0.0/0 is added to MongoDB Atlas Network Access'
        });
    }
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/shipping', require('./routes/shippingRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/collections', require('./routes/collectionRoutes'));
app.use('/api/subscribers', require('./routes/subscriberRoutes'));
app.use('/api/testimonials', require('./routes/testimonialRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/promomedia', require('./routes/promoMediaRoutes'));

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Customer Backend server is running on port ${PORT}`);
    });
}

module.exports = app;
