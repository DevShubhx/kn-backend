const mongoose = require('mongoose');

const UpdateSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: true,
    trim: true 
  },
  isPinned: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Update', UpdateSchema);
