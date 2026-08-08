const express = require('express');
const router = express.Router();
const ScreenBug = require('../models/screenBug');
const { protectAdmin } = require('../middleware/authMiddleware'); // यदि एडमिन लॉक है

// 📡 पब्लिक रूट: रिएक्ट प्लेयर इस एपीआई को हर 2 सेकंड में बैकग्राउंड में पोल (Fetch) करेगा
router.get('/live-settings', async (req, res) => {
    try {
        let bugs = await ScreenBug.find();
        
        // यदि डेटाबेस बिल्कुल खाली है, तो दोनों बग्स का डिफ़ॉल्ट डेटा ऑटो-क्रिएट करें
        if (bugs.length === 0) {
            bugs = await ScreenBug.insertMany([
                { bugId: 'SCREENBUG-1', isVisible: true, liveImage: 'your-logo.png', draftImage: 'your-logo.png' },
                { bugId: 'SCREENBUG-2', isVisible: true, liveImage: 'your-logo2.png', draftImage: 'your-logo2.png' }
            ]);
        }
        return res.status(200).json(bugs);
    } catch (err) {
        return res.status(500).json({ message: 'Error fetching graphics status: ' + err.message });
    }
});

// 🎛️ एडमिन रूट: चेकबॉक्स टिक/अनटिक करते ही लाइव अपडेट करने के लिए और ड्राफ्ट टाइपिंग सेव करने के लिए
router.post('/update-settings', async (req, res) => {
    try {
        const { bugId, isVisible, draftImage } = req.body;

        const bug = await ScreenBug.findOneAndUpdate(
            { bugId },
            { isVisible, draftImage }, // नियम 1 और 2: तुरंत बदलता है, लेकिन लाइव इमेज को नहीं छूता
            { new: true, upsert: true }
        );
        return res.status(200).json(bug);
    } catch (err) {
        return res.status(500).json({ message: 'Admin save failed: ' + err.message });
    }
});

// 🚀 एडमिन रूट: PUSH बटन दबाने पर ड्राफ्ट इमेज को लाइव इमेज में कॉपी करना
router.post('/push-live', async (req, res) => {
    try {
        const { bugId } = req.body;

        const bug = await ScreenBug.findOne({ bugId });
        if (!bug) return res.status(404).json({ message: 'Target graphic layer not found.' });

        // नियम 3: ड्राफ्ट में लिखी इमेज अब आधिकारिक रूप से लाइव टीवी स्क्रीन पर ट्रांसफर होगी
        bug.liveImage = bug.draftImage;
        await bug.save();

        return res.status(200).json({ message: `${bugId} successfully pushed live!`, bug });
    } catch (err) {
        return res.status(500).json({ message: 'Broadcast transmission failed: ' + err.message });
    }
});

module.exports = router;
