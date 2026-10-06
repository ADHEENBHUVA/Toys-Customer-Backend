const ContactEnquiry = require('../models/ContactEnquiry');

exports.createContactEnquiry = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        
        const newEnquiry = new ContactEnquiry({
            name,
            email,
            phone,
            subject: subject || 'General Inquiry',
            message
        });

        await newEnquiry.save();

        res.status(201).json({
            success: true,
            message: 'Your message has been sent successfully. We will get back to you soon!'
        });
    } catch (error) {
        console.error('Error creating contact enquiry:', error);
        res.status(500).json({ success: false, message: 'Server error while sending message.' });
    }
};
