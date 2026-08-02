// routes/scheduleRoutes.js - Complete Refactored CRUD Guide
const express = require('express');
const router = express.Router();
const WeeklySchedule = require('../models/WeeklySchedule');
const { protectAdmin } = require('../middleware/authMiddleware');

// 🎯 1. INJECT NEW SLOT (Admin Only)
router.post('/add', protectAdmin, async (req, res) => {
    try {
        const { showName, programmingBlock, startTime, durationInMinutes } = req.body;
        if (!showName || !startTime || !durationInMinutes) {
            return res.status(400).json({ message: 'Missing mandatory schedule data.' });
        }

        let finalizedDate = new Date(startTime);
        if (!startTime.includes('Z') && !startTime.includes('+')) {
            finalizedDate = new Date(`${startTime}:00+05:30`); // भारतीय समयानुसार एंकर
        }

        const newSlot = new WeeklySchedule({
            showName: showName.trim(),
            programmingBlock: programmingBlock ? programmingBlock.trim() : "",
            startTime: finalizedDate,
            durationInMinutes: parseInt(durationInMinutes, 10)
        });

        await newSlot.save();
        return res.status(201).json({ success: true, slot: newSlot });
    } catch (err) {
        return res.status(500).json({ message: 'Error adding slot: ' + err.message });
    }
});

// 🎯 2. GET CURRENT TIMELINE AND 7-DAYS BLOCK CATALOG (Public)
router.get('/timeline', async (req, res) => {
    try {
        const serverTimeMs = Date.now();
        
        // आज की शुरुआत (00:00 AM) से लेकर ठीक 7 दिन आगे की बाउंड्री सेट करना
        const startToday = new Date(serverTimeMs);
        startToday.setHours(0,0,0,0);
        
        const endTimelineMs = startToday.getTime() + (7 * 24 * 60 * 60 * 1000);

        const allSlots = await WeeklySchedule.find({
            startTime: { $gte: startToday, $lte: new Date(endTimelineMs) }
        }).sort({ startTime: 1 }).lean();

        let nowPlaying = null;
        let upNext = null;

        for (let i = 0; i < allSlots.length; i++) {
            const slot = allSlots[i];
            const startMs = new Date(slot.startTime).getTime();
            const endMs = startMs + (slot.durationInMinutes * 60 * 1000);

            if (serverTimeMs >= startMs && serverTimeMs < endMs) {
                nowPlaying = slot;
                if (i + 1 < allSlots.length) upNext = allSlots[i + 1];
                break;
            }
            if (startMs > serverTimeMs && !upNext) {
                upNext = slot;
            }
        }

        return res.status(200).json({
            serverTimeMs,
            nowPlaying,
            upNext,
            fullSchedule: allSlots
        });
    } catch (err) {
        return res.status(500).json({ message: 'Error fetching timeline: ' + err.message });
    }
});

module.exports = router;
