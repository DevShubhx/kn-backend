const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    isBannedUser: { type: Boolean, default: false } // अगर एडमिन इस यूजर को ब्लॉक कर दे
}, { timestamps: true });

module.exports = mongoose.model('Chat', ChatSchema);
