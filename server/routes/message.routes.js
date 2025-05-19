const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// Import the message controller (we'll create this next)
const messageController = require('../controllers/message.controller');

// Get all conversations for a user
router.get('/conversations', 
  authMiddleware.protect, 
  messageController.getUserConversations);

// Get messages for a specific conversation
router.get('/conversations/:conversationId', 
  authMiddleware.protect, 
  messageController.getConversationMessages);

// Create a new conversation
router.post('/conversations', 
  authMiddleware.protect, 
  messageController.createConversation);

// Send a message in a conversation
router.post('/conversations/:conversationId/messages', 
  authMiddleware.protect, 
  messageController.sendMessage);

// Mark messages as read
router.patch('/conversations/:conversationId/read', 
  authMiddleware.protect, 
  messageController.markAsRead);

// Delete a message (only your own)
router.delete('/messages/:messageId', 
  authMiddleware.protect, 
  messageController.deleteMessage);

module.exports = router;
