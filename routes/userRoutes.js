const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); // 🎯 नोडमेलर पैकेज इम्पोर्ट
const User = require('../models/User');

// ✉️ ईमेल ट्रांसपोर्टर कॉन्फ़िगरेशन
const transporter = nodemailer.createTransport({
    service: 'g m a i l'.replace(/\s+/g, ''),
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper function to sign tokens securely without weak fallback secrets
const generateToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('CRITICAL ENVIRONMENT FAULT: JWT_SECRET variable is completely unassigned inside your server .env parameters.');
    }
    
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// @route   POST /api/users/register
// @desc    Register a new user profile
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All registration profile input blocks are mandatory.' });
        }

        const userExists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'Username or Email already exists' });
        }

        const user = await User.create({
            username,
            email: email.toLowerCase(),
            password
        });

        const token = generateToken(user);

        return res.status(201).json({
            token,
            user: { id: user._id, username: user.username, email: user.email, role: user.role }
        });

    } catch (err) {
        console.error("User Registration Error Logged:", err);
        return res.status(500).json({ message: 'Server error during registration: ' + err.message });
    }
});

// @route   POST /api/users/login
// @desc    Authenticate user and get access token
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password fields are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user);

        return res.json({
            token,
            user: { id: user._id, username: user.username, email: user.email, role: user.role }
        });

    } catch (err) {
        console.error("User Authentication Login Error Logged:", err);
        return res.status(500).json({ message: 'Server error during login: ' + err.message });
    }
});

// @route   POST /api/users/forgot-password
// @desc    🔒 यूजर के ईमेल पर 6-डिजिट का पासवर्ड रीसेट कोड (ओटीपी) भेजना
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email address is required.' });
        }

        // 1. चेक करें कि क्या यूजर डेटाबेस में मौजूद है
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ message: 'No account found with this email.' });
        }

        // 2. एक सुरक्षित 6-डिजिट का ओटीपी जनरेट करें
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 3. डेटाबेस में यूजर ऑब्जेक्ट पर ओटीपी और उसकी एक्सपायरी (15 मिनट) सेव करें
        user.resetPasswordToken = otpCode;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; 
        await user.save();

        // 4. यूजर को मेल भेजने का लेआउट तैयार करें
        const mailOptions = {
            from: `"Kartoon Network Help" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: '🔒 KartoonNetwork - Password Reset Code',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                    <h2 style="color: #dc2626;">KartoonNetwork.in</h2>
                    <p>Hello <b>${user.username || 'Member'}</b>,</p>
                    <p>We received a request to reset your password. Use the verification code below to proceed:</p>
                    <div style="background-color: #fff; padding: 15px; border: 2px solid #dc2626; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; color: #000; margin: 20px 0;">
                        ${otpCode}
                    </div>
                    <p style="color: #666; font-size: 12px;">This code is strictly valid for 15 minutes only. If you didn't request this, you can safely ignore this email.</p>
                </div>
            `
        };

        // 5. मेल सेंड करें
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: 'Secure OTP sent successfully to your email.' });

    } catch (err) {
        console.error("🚨 Forgot Password API Rupture:", err.message);
        return res.status(500).json({ message: 'Failed to process request: ' + err.message });
    }
});

/**
 * @route   POST /api/users/reset-password
 * @desc    🎯 ओटीपी वेरीफाई करना और यूजर का नया पासवर्ड डेटाबेस में अपडेट करना
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'All inputs (Email, OTP code, and New Password) are required.' });
        }

        // 1. यूजर को ईमेल और स्टोर किए गए ओटीपी टोकन के ज़रिए ढूंढें
        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            resetPasswordToken: otp.trim()
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid Verification OTP Code or incorrect email address.' });
        }

        // 2. चेक करें कि कहीं ओटीपी 15 मिनट की समय सीमा से बाहर तो नहीं हो गया
        if (Date.now() > user.resetPasswordExpires) {
            return res.status(400).json({ message: 'This OTP has expired. Please request a new reset code.' });
        }

        // 3. नया पासवर्ड असाइन करें (User.js का प्री-सेव हुक इसे खुद हैश कर देगा)
        user.password = newPassword;
        
        // 4. उपयोग किए जा चुके ओटीपी टोकन को साफ़ (Clear) करें ताकि दोबारा इस्तेमाल न हो सके
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        
        await user.save();

        return res.status(200).json({ message: 'Password updated successfully! You can now log in with your new password.' });

    } catch (err) {
        console.error("🚨 Reset Password Verification Rupture:", err.message);
        return res.status(500).json({ message: 'Failed to update password: ' + err.message });
    }
});


module.exports = router;

