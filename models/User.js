// [File: stream-backend/models/User.js]
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        default: 'user' 
    }
}, { timestamps: true });

// 🔒 HOOK 1: Clean Async Encryption Middleware (No argument confusion)
UserSchema.pre('save', async function () {
    // Only run encryption if the password field is new or modified
    if (!this.isModified('password')) return;

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw new Error('Password encryption processing failed: ' + err.message);
    }
});

// 🔑 HOOK 2: Password Match Evaluator
UserSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
