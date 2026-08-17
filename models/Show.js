const mongoose = require('mongoose');

// 🎬 Keep your original nested Episode layout perfectly safe
const EpisodeSchema = new mongoose.Schema({
    episodeNumber: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    streamUrl: {
        type: String,
        required: true
    },
    downloadUrl: {
        type: String,
        required: true
    }
});

const ShowSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    // 🍿 NEW SELECTOR: Decides if it is a multi-episode Series or a single Movie
    contentType: { 
        type: String, 
        required: true, 
        enum: ['show', 'movie'], 
        default: 'show' 
    },
    posterUrl: {
        type: String,
        required: true
    },
    // 🖼️ NEW FIELD: Used for the outer welcome grid cards
    cardUrl: { 
        type: String, 
        required: true 
    },
    // 🔒 PROTECTED field name: Keeps your exact original 'genre' array alive
    genre: [String],
    
    episodes: [EpisodeSchema],

    // 💬 NEW EMBEDDED FAN DISCUSSION MATRIX LAYER
    comments: [{
        username: { type: String, required: true },
        text: { type: String, required: true },
        isApproved: { type: Boolean, default: false }, // 🔒 Hidden from public until checked
        createdAt: { type: Date, default: Date.now },
        replies: [{ // 🛡️ Embedded Admin replies array list container
            username: { type: String, default: 'Admin 🛡️' },
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }]
    }],

    // 🕒 THE NO-CODE CATALOGUE CLOCK: Updates ONLY when fresh media items or episodes drop
    lastEpisodeAddedAt: { 
        type: Date, 
        default: Date.now 
    },

    // 🎯 FIXED HIGH ACCURACY: लाइव टीवी इंजन फ़ील्ड्स को कड़ाई से पहले कोर-फ़ील्ड्स ब्रैकेट में मर्ज किया गया है
    // इससे मोंगूस की डेटाबेस लेयर पूरी तरह स्टेबल और सिंक हो जाएगी
    isLiveScheduled: {
        type: Boolean,
        default: false
    },
    liveStartTime: {
        type: Date
    },
    durationInSeconds: {
        type: Number,
        default: 0
    },
    liveEpisodeTitle: {
        type: String
    },
    liveStreamUrl: {
        type: String
    },
    liveDownloadUrl: {
        type: String
    }
},
{
    // 🔒 PROTECTED setting: अब यह दूसरा ब्रैकेट मोंगूस इंजन द्वारा 100% सही तरीके से पढ़ा जाएगा
    // यह डेटाबेस में प्रत्येक नए शो के साथ खुद-ब-खुद 'createdAt' और 'updatedAt' टाइमस्टैम्प्स को जन्म देगा!
    timestamps: true 
});

module.exports = mongoose.model('Show', ShowSchema);
