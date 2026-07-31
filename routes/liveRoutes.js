const express = require('express');
const router = express.Router();
const LiveStream = require('../models/LiveStream');
const { protectAdmin } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/live-tv/schedule
 * @desc    Admin Panel: Schedule a broadcast (Kick Integrated)
 */
router.post('/schedule', protectAdmin, async (req, res) => {
    try {
        const { customTitle, episodeTitle, streamUrl, liveStartTime, durationInSeconds } = req.body;

        // 🎯 Kick Setup Fix: payload validation में से streamUrl की अनिवार्यता हटा दी गई है
        if (!customTitle || !episodeTitle || !liveStartTime || !durationInSeconds) {
            return res.status(400).json({ message: 'Missing mandatory payload variables.' });
        }

        const parsedDuration = parseInt(durationInSeconds, 10);
        if (isNaN(parsedDuration) || parsedDuration <= 0) {
            return res.status(400).json({ message: 'Duration must be a positive integer.' });
        }

        const newLive = new LiveStream({
            customTitle: customTitle.trim(),
            episodeTitle: episodeTitle.trim(),
            streamUrl: streamUrl ? streamUrl.trim() : "", // Optional or fallback empty string
            liveStartTime: new Date(liveStartTime),
            durationInSeconds: parsedDuration
        });

        const savedLive = await newLive.save();
        return res.status(201).json(savedLive);
    } catch (err) {
        return res.status(500).json({ message: 'Failed to schedule live: ' + err.message });
    }
});

/**
 * @route   GET /api/live-tv/live-timetable
 * @desc    Get custom scheduled live shows
 */
router.get('/live-timetable', async (req, res) => {
    try {
        const serverTimeMs = Date.now();
        const lookbackWindowMs = 24 * 60 * 60 * 1000;
        const boundaryDate = new Date(serverTimeMs - lookbackWindowMs);

        const customLiveShows = await LiveStream.find({
            liveStartTime: { $gte: boundaryDate }
        })
        .sort({ liveStartTime: 1 })
        .lean();

        return res.status(200).json({
            serverTimeMs,
            schedule: customLiveShows
        });
    } catch (err) {
        console.error("📋 Live Timetable Fetch Error:", err);
        return res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

module.exports = router;
