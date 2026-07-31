const express = require('express');
const router = express.Router();
const Update = require('../models/Update'); // Reads from your models/Update.js cleanly

/**
 * @route   POST /api/updates
 * @desc    Admin Panel: Manually post a live notification bullet point
 * @access  Public (Can add admin auth verification later)
 */
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Announcement text content cannot be blank." });
    }

    const newBullet = new Update({ text: text.trim() });
    await newBullet.save();

    return res.status(201).json({ success: true, item: newBullet });
  } catch (err) {
    console.error("Backend Bulletin Creation Error:", err);
    return res.status(500).json({ error: "Internal database transaction failed." });
  }
});

/**
 * @route   GET /api/updates
 * @desc    Public Catalog: Get the 5 most recent announcements
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const list = await Update.find({}).sort({ createdAt: -1 }).limit(16);
    return res.status(200).json(list);
  } catch (err) {
    console.error("Backend Bulletin Fetch Error:", err);
    return res.status(500).json({ error: "Failed to load update board." });
  }
});

const { protectAdmin } = require('../middleware/authMiddleware'); // Import your secure guard

/**
 * @route   DELETE /api/updates/:id
 * @desc    Admin Panel: Manually remove an announcement bulletin from the system
 * @access  Private / Admin
 */
router.delete('/:id', protectAdmin, async (req, res) => {
  try {
    const deletedUpdate = await Update.findByIdAndDelete(req.params.id);
    
    if (!deletedUpdate) {
      return res.status(404).json({ error: "Target announcement bullet point could not be located." });
    }

    return res.status(200).json({ success: true, message: "Announcement cleanly scrubbed from database matrix." });
  } catch (err) {
    console.error("Backend Bulletin Deletion Error:", err);
    return res.status(500).json({ error: "Internal database deletion transaction failed." });
  }
});


module.exports = router;
