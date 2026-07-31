const mongoose = require('mongoose');

const LiveStreamSchema = new mongoose.Schema({
    customTitle: { type: String, required: true, trim: true },
    episodeTitle: { type: String, required: true, trim: true },
    // 🎯 किक सेटअप के लिए इसे optional (required: false) कर दिया गया है
    streamUrl: { type: String, required: false, trim: true },
    liveStartTime: { type: Date, required: true },
    durationInSeconds: { type: Number, required: true, min: 1 }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

LiveStreamSchema.index({ liveStartTime: 1, durationInSeconds: 1 });

module.exports = mongoose.model('LiveStream', LiveStreamSchema);
