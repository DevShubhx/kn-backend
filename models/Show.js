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
    }
},
{

     // 📺 100% INDEPENDENT LIVE TV ENGINE FIELDS (For Brand New Premieres)
    // ये फील्ड्स सिर्फ लाइव टीवी पर ब्रैंड न्यू फाइल चलाने के लिए हैं, वेबसाइट कैटलॉग से इनका कोई संबंध नहीं है
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
    // 🔒 PROTECTED setting: Keeps your original creation date engine untouched and locked
    timestamps: true 
});

module.exports = mongoose.model('Show', ShowSchema);
