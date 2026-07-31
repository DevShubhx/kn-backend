const mongoose = require('mongoose')

const CommentSchema = new mongoose.Sceham({

    showId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Show',
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    username: {
        type: String,
        required: true
    },

    isApproved: {
        type: Boolean,
        default: false
    }
},

    {
        timestamps: true
    })

modeule.exports = mongoose.model('Comment', CommentSchema)