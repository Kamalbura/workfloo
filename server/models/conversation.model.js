const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    // For group conversations
  },
  type: {
    type: String,
    enum: ['private', 'group'],
    default: 'private'
  },
  participants: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Conversation must have participants']
  }],
  lastMessage: {
    type: mongoose.Schema.ObjectId,
    ref: 'Message'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Conversation must have a creator']
  },
  organization: {
    type: mongoose.Schema.ObjectId,
    ref: 'Organization'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
conversationSchema.index({ participants: 1 });
conversationSchema.index({ organization: 1 });

// If it's a private conversation, make sure participants are unique
conversationSchema.pre('save', function(next) {
  if (this.isModified('participants') && this.type === 'private') {
    // Remove any duplicates
    this.participants = [...new Set(this.participants.map(p => p.toString()))];
    
    // Ensure there are at least 2 participants for a private conversation
    if (this.participants.length < 2) {
      return next(new Error('Private conversations must have at least 2 participants'));
    }
  }
  next();
});

// Update the 'updatedAt' field on save
conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual to get all messages for a conversation
conversationSchema.virtual('messages', {
  ref: 'Message',
  foreignField: 'conversation',
  localField: '_id'
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
