const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// Helper to format/derive name from email
const deriveNameFromEmail = (email) => {
    if (!email) return 'Customer';
    const prefix = email.split('@')[0];
    const words = prefix.replace(/[._\-0-9]+/g, ' ').trim().split(/\s+/);
    if (!words.length || !words[0]) return 'Customer';
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

// @route   GET /api/user/profile
// @desc    Get current customer's profile & addresses
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-__v');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If user has no name for some reason, ensure default name from email
        if (!user.name || !user.name.trim()) {
            user.name = deriveNameFromEmail(user.email);
            await user.save();
        }

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            picture: user.picture || '',
            provider: user.provider,
            role: user.role,
            addresses: user.addresses || [],
            createdAt: user.createdAt
        });
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ message: 'Server error fetching user profile' });
    }
});

// @route   PUT /api/user/profile
// @desc    Update customer profile (Name & Phone)
// Note: Customer can change name, but Name is mandatory ("Farjiyat Tya Name J Lakhvu pade")
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, phone } = req.body;

        // Mandatory check for name
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ 
                message: 'Name is mandatory and cannot be empty. Please enter your name.' 
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = name.trim();
        if (phone !== undefined) {
            user.phone = typeof phone === 'string' ? phone.trim() : String(phone);
        }

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                picture: user.picture,
                provider: user.provider,
                role: user.role,
                addresses: user.addresses || [],
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Server error updating profile' });
    }
});

// @route   GET /api/user/addresses
// @desc    Get all saved addresses for the customer
router.get('/addresses', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('addresses');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.addresses || []);
    } catch (err) {
        console.error('Error fetching addresses:', err);
        res.status(500).json({ message: 'Server error fetching addresses' });
    }
});

// @route   POST /api/user/addresses
// @desc    Add a new address (MAX 5 addresses allowed!)
// Rule: Customer can only add up to 5 addresses. If they have 5, they must delete 1 address first.
router.post('/addresses', authMiddleware, async (req, res) => {
    try {
        const { fullName, phone, streetAddress, city, state, zipCode, isDefault } = req.body;

        // Validation
        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ message: 'Full name is required for delivery' });
        }
        if (!phone || !phone.trim()) {
            return res.status(400).json({ message: 'Mobile phone number is required' });
        }
        if (!streetAddress || !streetAddress.trim()) {
            return res.status(400).json({ message: 'Street address is required' });
        }
        if (!city || !city.trim()) {
            return res.status(400).json({ message: 'City is required' });
        }
        if (!state || !state.trim()) {
            return res.status(400).json({ message: 'State is required' });
        }
        if (!zipCode || !zipCode.trim()) {
            return res.status(400).json({ message: 'Pincode is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.addresses) {
            user.addresses = [];
        }

        // Strict limit of 5 addresses
        if (user.addresses.length >= 5) {
            return res.status(400).json({ 
                message: 'You have reached the maximum limit of 5 saved addresses. Please delete an existing address to add a new one.' 
            });
        }

        const shouldBeDefault = isDefault || user.addresses.length === 0;

        if (shouldBeDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });
        }

        const newAddress = {
            fullName: fullName.trim(),
            phone: phone.trim(),
            streetAddress: streetAddress.trim(),
            city: city.trim(),
            state: state.trim(),
            zipCode: zipCode.trim(),
            isDefault: shouldBeDefault
        };

        user.addresses.push(newAddress);
        await user.save();

        res.status(201).json({
            message: 'Address saved successfully',
            addresses: user.addresses,
            addedAddress: user.addresses[user.addresses.length - 1]
        });
    } catch (err) {
        console.error('Error adding address:', err);
        res.status(500).json({ message: 'Server error saving address' });
    }
});

// @route   PUT /api/user/addresses/:addressId
// @desc    Update an existing address
router.put('/addresses/:addressId', authMiddleware, async (req, res) => {
    try {
        const { fullName, phone, streetAddress, city, state, zipCode, isDefault } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.id(req.params.addressId);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        if (fullName !== undefined) address.fullName = fullName.trim();
        if (phone !== undefined) address.phone = phone.trim();
        if (streetAddress !== undefined) address.streetAddress = streetAddress.trim();
        if (city !== undefined) address.city = city.trim();
        if (state !== undefined) address.state = state.trim();
        if (zipCode !== undefined) address.zipCode = zipCode.trim();

        if (isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = addr._id.toString() === address._id.toString();
            });
        }

        await user.save();

        res.json({
            message: 'Address updated successfully',
            addresses: user.addresses
        });
    } catch (err) {
        console.error('Error updating address:', err);
        res.status(500).json({ message: 'Server error updating address' });
    }
});

// @route   DELETE /api/user/addresses/:addressId
// @desc    Delete an address
router.delete('/addresses/:addressId', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressToDelete = user.addresses.id(req.params.addressId);
        if (!addressToDelete) {
            return res.status(404).json({ message: 'Address not found' });
        }

        const wasDefault = addressToDelete.isDefault;
        user.addresses.pull({ _id: req.params.addressId });

        // If the deleted address was default, make the first remaining address default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();

        res.json({
            message: 'Address deleted successfully',
            addresses: user.addresses
        });
    } catch (err) {
        console.error('Error deleting address:', err);
        res.status(500).json({ message: 'Server error deleting address' });
    }
});

// @route   PUT /api/user/addresses/:addressId/default
// @desc    Set an address as default
router.put('/addresses/:addressId/default', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let found = false;
        user.addresses.forEach(addr => {
            if (addr._id.toString() === req.params.addressId) {
                addr.isDefault = true;
                found = true;
            } else {
                addr.isDefault = false;
            }
        });

        if (!found) {
            return res.status(404).json({ message: 'Address not found' });
        }

        await user.save();

        res.json({
            message: 'Default address updated',
            addresses: user.addresses
        });
    } catch (err) {
        console.error('Error setting default address:', err);
        res.status(500).json({ message: 'Server error setting default address' });
    }
});

module.exports = router;

