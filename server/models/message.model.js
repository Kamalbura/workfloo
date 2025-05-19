const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.ObjectId,
    ref: 'Conversation',
    required: [true, 'Message must belong to a conversation']
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Message must have a sender']
  },
  text: {
    type: String,
    trim: true
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure that either text or attachments are provided
messageSchema.pre('validate', function(next) {
  if (!this.text && (!this.attachments || this.attachments.length === 0)) {
    this.invalidate('text', 'Message must contain either text or attachments');
  }
  next();
});

// Indexes for efficient querying
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ conversation: 1, isRead: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
