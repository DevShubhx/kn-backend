const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');

// गंदे शब्दों की डिफ़ॉल्ट लिस्ट (एडमिन इसे बदल सकता है)
let bannedWords = ['spam', 'abuse', 'hack', 'badword'];
let blockedEmails = new Set(); // ब्लॉक किए गए यूजर्स की लिस्ट

// 📡 चैट इतिहास लोड करने का रूट (केवल पिछले 50 मैसेज ताकि लोड न बढ़े)
router.get('/history', async (req, res) => {
    try {
        const messages = await Chat.find().sort({ createdAt: -1 }).limit(50);
        return res.status(200).json(messages.reverse());
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// 🎛️ एडमिन रूट: किसी शब्द को बैन लिस्ट में जोड़ना
router.post('/ban-word', (req, res) => {
    const { word } = req.body;
    if (word) bannedWords.push(word.toLowerCase().trim());
    return res.status(200).json({ message: `Word '${word}' added to filter list.`, bannedWords });
});

// 🎛️ एडमिन रूट: किसी यूजर को ईमेल से ब्लॉक (Kick) करना
router.post('/block-user', async (req, res) => {
    const { email } = req.body;
    if (email) {
        blockedEmails.add(email.toLowerCase().trim());
        // डेटाबेस में भी उसके पुराने मैसेज पर फ्लैग लगा दें
        await Chat.updateMany({ email: email.toLowerCase() }, { isBannedUser: true });
    }
    return res.status(200).json({ message: `User ${email} has been blocked from chat.` });
});

// हेल्पर फंक्शन: मैसेज को फिल्टर करने के लिए
const filterMessage = (text) => {
    let cleanText = text;
    bannedWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        cleanText = cleanText.replace(regex, '****');
    });
    return cleanText;
};

// सॉकेट में यूज करने के लिए एक्सपोर्ट
module.exports = { router, blockedEmails, filterMessage };
