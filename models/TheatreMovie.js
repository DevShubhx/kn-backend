// models/TheatreMovie.js
const mongoose = require('mongoose');

const TheatreMovieSchema = new mongoose.Schema({
    movieNumber: { type: Number, required: true, unique: true }, // 1, 2, 3, 4 (For the 4 Sundays)
    title: { type: String, required: true },
    synopsis: { type: String, required: true },
    telecastDate: { type: Date, required: true }, // Sunday Date
    telecastTime: { type: String, required: true }, // e.g., "12:00 PM IST"
    templateImageUrl: { type: String, required: true } // Background layout poster
}, { timestamps: true });

module.exports = mongoose.model('TheatreMovie', TheatreMovieSchema);
