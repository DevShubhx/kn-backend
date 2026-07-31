// routes/theatreRoutes.js - Complete Refactored Code Block
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 🎯 ZERO-ERROR IMPORT HOOK: यदि पुराना पाथ फेल हो, तो यह मोंगूस के रजिस्टर्ड मॉडल क्लस्टर से सीधे ब्लूप्रिंट उठाएगा
let TheatreMovie;
try {
    TheatreMovie = mongoose.model('TheatreMovie');
} catch (e) {
    // यदि मॉडल पहले से इनिशियलाइज्ड नहीं है, तो सटीक पाथ से दोबारा लोड करें
    TheatreMovie = require('../models/TheatreMovie');
}

const { protectAdmin } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/theatre/update-schedule
 * @desc    Admin Panel: Update one of the 4 movie slots for the month
 * @access  Private / Admin
 */
// routes/theatreRoutes.js के अंदर केवल इस विशिष्ट update-schedule पोस्ट राउट को बदलें:

router.post('/update-schedule', protectAdmin, async (req, res) => {
    try {
        const { movieNumber, title, synopsis, telecastDate, telecastTime, templateImageUrl } = req.body;

        if (!movieNumber || !title || !synopsis || !telecastDate || !telecastTime || !templateImageUrl) {
            return res.status(400).json({ message: 'Missing required fields for theatre slot registration.' });
        }

        // 🎯 MODERN MONGOOSE UPGRADE: Warning को जड़ से मिटाने के लिए returnDocument: 'after' का उपयोग
        const updatedMovie = await TheatreMovie.findOneAndUpdate(
            { movieNumber: parseInt(movieNumber, 10) },
            { title, synopsis, telecastDate: new Date(telecastDate), telecastTime, templateImageUrl },
            { returnDocument: 'after', upsert: true } // 🔒 FIXED: { new: true } को आधुनिक फ़्लैग से बदल दिया गया है
        );

        return res.status(200).json(updatedMovie);
    } catch (err) {
        return res.status(500).json({ message: 'Theatre slot update failed: ' + err.message });
    }
});

/**
 * @route   GET /api/theatre/schedule
 * @desc    Public: Get all 4 movies scheduled for the current month
 * @access  Public
 */
router.get('/schedule', async (req, res) => {
    try {
        const schedule = await TheatreMovie.find().sort({ movieNumber: 1 }).lean();
        return res.status(200).json(schedule);
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch theatre schedule: ' + err.message });
    }
});

module.exports = router;
