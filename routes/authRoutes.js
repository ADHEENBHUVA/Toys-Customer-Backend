const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const admin = require('../config/firebaseConfig');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage' // Required for @react-oauth/google auth-code flow
);

// @route POST /api/auth/social
// @desc Authenticate with Google/Apple
router.post('/social', async (req, res) => {
    try {
        const { provider, accessToken, idToken } = req.body;
        
        let uid, email, name, picture;

        if (provider === 'google' && accessToken) {
            // Fetch user info directly using the access token
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            
            if (!userInfoRes.ok) {
                return res.status(401).json({ message: 'Invalid Google access token' });
            }
            
            const payload = await userInfoRes.json();
            
            uid = payload.sub; // Google's unique ID for the user
            email = payload.email;
            name = payload.name;
            picture = payload.picture;
            
        } else if (provider === 'apple' || (provider === 'google' && idToken)) {
            // Login via Firebase (Apple or Google)
            if (!idToken) return res.status(400).json({ message: 'No ID token provided' });
            
            if (!admin.app) {
                 return res.status(400).json({ message: 'Firebase not configured for Apple login' });
            }
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            uid = decodedToken.uid;
            email = decodedToken.email;
            name = decodedToken.name;
            picture = decodedToken.picture;
            
        } else {
            return res.status(400).json({ message: 'Invalid provider' });
        }

        if (!email) {
            return res.status(400).json({ message: 'Email not provided by auth provider' });
        }

        // Check if user already exists
        let user = await User.findOne({ email });

        if (!user) {
            // Create a new user
            user = new User({
                firebaseUid: uid, // We store the Google 'sub' or Firebase 'uid' here
                email: email,
                name: name || '',
                picture: picture || '',
                provider: provider
            });
            await user.save();
        } else if (!user.firebaseUid || user.provider !== provider) {
            // Update info if they log in via a different method
            user.firebaseUid = uid;
            user.provider = provider;
            await user.save();
        }

        // Create JWT for our custom backend session
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        const jwtSecret = process.env.JWT_SECRET || 'your_temporary_jwt_secret_change_me';
        
        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user });
            }
        );
        
    } catch (err) {
        console.error('Social Auth Error:', err);
        res.status(500).json({ message: 'Server error during social authentication', error: err.message });
    }
});

module.exports = router;
