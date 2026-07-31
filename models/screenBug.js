const mongoose = require('mongoose');

const ScreenBugSchema = new mongoose.Schema({
    bugId: { type: String, required: true, unique: true }, // "SCREENBUG-1" या "SCREENBUG-2"
    isVisible: { type: Boolean, default: true },          // 1. लाइव चेकबॉक्स स्टेटस
    liveImage: { type: String, default: 'your-logo.png' }, // 3. लाइव टीवी पर दिखने वाली असली इमेज (PUSH होने के बाद)
    draftImage: { type: String, default: 'your-logo.png' } // 2. एडमिन बॉक्स में टाइप की जा रही कच्ची इमेज
}, { timestamps: true });

module.exports = mongoose.model('ScreenBug', ScreenBugSchema);
