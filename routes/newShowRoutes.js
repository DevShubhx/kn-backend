// routes/newShowRoutes.js
const express = require('express');
const router = express.Router();
const NewShowCard = require('../models/NewShowCard');
const { protectAdmin } = require('../middleware/authMiddleware');

// 🎯 1. GET ALL CARDS (Public)
router.get('/all', async (req, res) => {
    try {
        const cards = await NewShowCard.find().sort({ createdAt: -1 }).lean();
        return res.status(200).json(cards);
    } catch (err) {
        return res.status(500).json({ message: 'Failed fetching cards: ' + err.message });
    }
});

// 🎯 2. ADD NEW CARD (Admin Only)
router.post('/add', protectAdmin, async (req, res) => {
    try {
        const { headerText, headerIconUrl, description, thumbnailUrl } = req.body;
        if (!headerText || !description || !thumbnailUrl) {
            return res.status(400).json({ message: 'Missing mandatory fields.' });
        }
        const newCard = new NewShowCard({ headerText, headerIconUrl, description, thumbnailUrl });
        await newCard.save();
        return res.status(201).json({ success: true, card: newCard });
    } catch (err) {
        return res.status(500).json({ message: 'Failed adding card: ' + err.message });
    }
});

// 🎯 3. UPDATE CARD BY ID (Admin Only)
router.put('/update/:id', protectAdmin, async (req, res) => {
    try {
        const { headerText, headerIconUrl, description, thumbnailUrl } = req.body;
        const updatedCard = await NewShowCard.findByIdAndUpdate(
            req.params.id,
            { headerText, headerIconUrl, description, thumbnailUrl },
            { returnDocument: 'after' }
        );
        if (!updatedCard) return res.status(404).json({ message: 'Card not found.' });
        return res.status(200).json({ success: true, card: updatedCard });
    } catch (err) {
        return res.status(500).json({ message: 'Update transaction failed: ' + err.message });
    }
});

// 🎯 4. DELETE CARD BY ID (Admin Only)
router.delete('/delete/:id', protectAdmin, async (req, res) => {
    try {
        const deletedCard = await NewShowCard.findByIdAndDelete(req.params.id);
        if (!deletedCard) return res.status(404).json({ message: 'Card not found.' });
        return res.status(200).json({ success: true, message: 'Card deleted successfully!' });
    } catch (err) {
        return res.status(500).json({ message: 'Delete failed: ' + err.message });
    }
});

module.exports = router;
