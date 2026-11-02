const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const admin = require('../config/firebaseConfig');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage' // Required for @react-oauth/google auth-code flow
);

// Helper function to extract a neat formatted name from an email address
// e.g., 'rohit.sharma99@gmail.com' -> 'Rohit Sharma'
const deriveNameFromEmail = (email) => {
    if (!email) return 'Customer';
    const prefix = email.split('@')[0];
    const cleaned = prefix.replace(/[._\-0-9]+/g, ' ').trim();
    if (!cleaned) return 'Customer';
    return cleaned
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
};

// @route POST /api/auth/social
// @desc Authenticate with Google/Apple
router.post('/social', async (req, res) => {
    try {
        const { provider, accessToken, idToken } = req.body;
        
        let uid, email, name, picture;

        if (provider === 'google') {
            const token = accessToken || idToken || req.body.credential;
            if (!token && !req.body.code) {
                return res.status(400).json({ message: 'No Google access token or credential provided' });
            }

            if (accessToken) {
                // Fetch user info directly using the access token
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                
                if (userInfoRes.ok) {
                    const payload = await userInfoRes.json();
                    uid = payload.sub;
                    email = payload.email;
                    name = payload.name;
                    picture = payload.picture;
                } else {
                    return res.status(401).json({ message: 'Invalid Google access token' });
                }
            } else if (idToken || req.body.credential) {
                const tokenToVerify = idToken || req.body.credential;
                try {
                    const ticket = await googleClient.verifyIdToken({
                        idToken: tokenToVerify,
                        audience: process.env.GOOGLE_CLIENT_ID
                    });
                    const payload = ticket.getPayload();
                    uid = payload.sub;
                    email = payload.email;
                    name = payload.name;
                    picture = payload.picture;
                } catch (verifyErr) {
                    // Fallback to Google tokeninfo endpoint
                    const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenToVerify}`);
                    if (!tokenInfoRes.ok) {
                        console.error('Google token verification error:', verifyErr);
                        return res.status(401).json({ message: 'Invalid Google ID token' });
                    }
                    const payload = await tokenInfoRes.json();
                    uid = payload.sub;
                    email = payload.email;
                    name = payload.name;
                    picture = payload.picture;
                }
            } else if (req.body.code) {
                const { tokens } = await googleClient.getToken(req.body.code);
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokens.access_token}` }
                });
                if (!userInfoRes.ok) {
                    return res.status(401).json({ message: 'Invalid Google auth code' });
                }
                const payload = await userInfoRes.json();
                uid = payload.sub;
                email = payload.email;
                name = payload.name;
                picture = payload.picture;
            }
        } else if (provider === 'apple') {
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

        // Determine final display name from OAuth or derive from email
        const finalName = (name && name.trim()) ? name.trim() : deriveNameFromEmail(email);

        // Check if user already exists
        let user = await User.findOne({ email });

        if (!user) {
            // Create a new user with Google/Email account name
            user = new User({
                firebaseUid: uid || `oauth_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                email: email,
                name: finalName,
                picture: picture || '',
                provider: provider || 'google'
            });
            await user.save();
        } else {
            let modified = false;
            // If existing user has no name or empty name, populate with Google name or derived name
            if (!user.name || !user.name.trim()) {
                user.name = finalName;
                modified = true;
            }
            if (picture && !user.picture) {
                user.picture = picture;
                modified = true;
            }
            if (!user.firebaseUid || user.provider !== provider) {
                user.firebaseUid = uid || user.firebaseUid;
                user.provider = provider;
                modified = true;
            }
            if (modified) {
                await user.save();
            }
        }

        // Create JWT for session
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

// @route POST /api/auth/register
// @desc Register a new customer with Name, Email & Password
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ message: 'Email address is required' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(400).json({ 
                message: existingUser.provider === 'google'
                    ? 'An account with this email was created via Google. Please sign in with Google.'
                    : 'An account with this email already exists. Please sign in with your password.'
            });
        }

        const derivedName = (name && name.trim()) ? name.trim() : deriveNameFromEmail(normalizedEmail);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            firebaseUid: `email_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            email: normalizedEmail,
            name: derivedName,
            password: hashedPassword,
            provider: 'password',
            role: 'customer'
        });

        await newUser.save();

        const payload = {
            user: {
                id: newUser.id,
                role: newUser.role
            }
        };

        const jwtSecret = process.env.JWT_SECRET || 'your_temporary_jwt_secret_change_me';

        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    token,
                    user: {
                        id: newUser._id,
                        name: newUser.name,
                        email: newUser.email,
                        phone: newUser.phone || '',
                        picture: newUser.picture || '',
                        addresses: newUser.addresses || [],
                        role: newUser.role
                    }
                });
            }
        );
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ message: 'Server error during registration', error: err.message });
    }
});

// @route POST /api/auth/email-login
// @desc Authenticate with Email & Password
router.post('/email-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ message: 'Email address is required' });
        }
        if (!password || !password.trim()) {
            return res.status(400).json({ message: 'Password is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        let user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({ 
                message: 'No account found with this email. Please click "Create an account" below to register.' 
            });
        }

        // Check password
        if (user.password) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Incorrect password. Please enter your correct password.' });
            }
        } else {
            // User has no password set (e.g. created via Google)
            if (user.provider === 'google') {
                return res.status(400).json({ 
                    message: 'This account was registered with Google. Please click "Google Rocket" to sign in.' 
                });
            } else {
                // Legacy password account without hash: lock in this password now
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);
                await user.save();
            }
        }

        // If user has blank name, set derived name
        if (!user.name || !user.name.trim()) {
            user.name = deriveNameFromEmail(normalizedEmail);
            await user.save();
        }

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
                res.json({ 
                    token, 
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone || '',
                        picture: user.picture || '',
                        addresses: user.addresses || [],
                        role: user.role
                    } 
                });
            }
        );
    } catch (err) {
        console.error('Email Login Error:', err);
        res.status(500).json({ message: 'Server error during email login', error: err.message });
    }
});

// @route GET /api/auth/me
// @desc Get authenticated user data
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-__v');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Auth check error:', err);
        res.status(500).json({ message: 'Server error fetching user session' });
    }
});

module.exports = router;
