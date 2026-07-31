// models/NewShowCard.js
const mongoose = require('mongoose');

const NewShowCardSchema = new mongoose.Schema({
    headerText: { type: String, required: true },
    headerIconUrl: { type: String, default: "" }, // वैकल्पिक छोटा आइकॉन
    description: { type: String, required: true },
    thumbnailUrl: { type: String, required: true } // छोटा 1:1 स्क्वायर थंबनेल
}, { timestamps: true });

module.exports = mongoose.model('NewShowCard', NewShowCardSchema);
