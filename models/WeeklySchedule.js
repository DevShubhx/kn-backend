// models/WeeklySchedule.js - Re-written for Programming Blocks
const mongoose = require('mongoose');

const WeeklyScheduleSchema = new mongoose.Schema({
    showName: { type: String, required: true },
    programmingBlock: { type: String, default: "" }, // 🎯 NEW: Toonami, Power Zone, Half Ticket Express, Tiny TV etc.
    startTime: { type: Date, required: true },       // ISO Date Time
    durationInMinutes: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('WeeklySchedule', WeeklyScheduleSchema);
