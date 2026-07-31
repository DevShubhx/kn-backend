// models/Poll.js
const mongoose = require('mongoose');

const PollSchema = new mongoose.Schema({
    pollId: { type: String, default: "best_of_three", unique: true },
    options: [
        {
            showName: { type: String, required: true },
            votes: { type: Number, default: 0 }
        }
    ],
    votedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // डुप्लिकेट वोट्स रोकने के लिए
}, { timestamps: true });

module.exports = mongoose.model('Poll', PollSchema);
