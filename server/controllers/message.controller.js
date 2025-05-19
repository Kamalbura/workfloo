const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');

/**
 * Get all conversations for the current user
 */
exports.getUserConversations = async (req, res) => {
  try {
    // Find all conversations where the current user is a participant
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate({
        path: 'participants',
        select: 'firstName lastName email avatar role'
      })
      .populate({
        path: 'lastMessage',
        select: 'text sender createdAt isRead'
      })
      .sort({ updatedAt: -1 });

    // Format conversations to include unread count
    const formattedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Count unread messages for this user in this conversation
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          isRead: false,
          sender: { $ne: req.user._id }
        });

        return {
          _id: conversation._id,
          name: conversation.name,
          type: conversation.type,
          participants: conversation.participants,
          lastMessage: conversation.lastMessage,
          unreadCount,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt
        };
      })
    );

    res.status(200).json({
      status: 'success',
      results: formattedConversations.length,
      data: {
        conversations: formattedConversations
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * Get messages for a specific conversation
 */
exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Check if conversation exists and if user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        status: 'fail',
        message: 'Conversation not found'
      });
    }
    
    // Check if user is a participant
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to access this conversation'
      });
    }
    
    // Get messages with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Message.countDocuments({ conversation: conversationId });
    
    // Get messages
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'sender',
        select: 'firstName lastName email avatar role'
      });
    
    res.status(200).json({
      status: 'success',
      results: messages.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        messages: messages.reverse() // Return in chronological order
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * Create a new conversation
 */
exports.createConversation = async (req, res) => {
  try {
    const { name, participants, type } = req.body;
    
    // Ensure at least one other participant is included
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'At least one participant is required'
      });
    }
    
    // Add current user to participants if not already included
    const allParticipants = participants.includes(req.user._id.toString())
      ? participants
      : [...participants, req.user._id];
    
    // Check if participants exist
    const participantUsers = await User.find({ _id: { $in: allParticipants } });
    if (participantUsers.length !== allParticipants.length) {
      return res.status(404).json({
        status: 'fail',
        message: 'One or more participants do not exist'
      });
    }
    
    // Check if a direct message conversation already exists for 2 users
    if (type === 'private' && allParticipants.length === 2) {
      const existingConversation = await Conversation.findOne({
        type: 'private',
        participants: { $all: allParticipants, $size: 2 }
      });
      
      if (existingConversation) {
        return res.status(200).json({
          status: 'success',
          data: {
            conversation: existingConversation
          }
        });
      }
    }
    
    // Create the conversation
    const newConversation = await Conversation.create({
      name: name || null,
      type: type || 'private',
      participants: allParticipants,
      createdBy: req.user._id
    });
    
    // Populate participant details
    const populatedConversation = await Conversation.findById(newConversation._id)
      .populate({
        path: 'participants',
        select: 'firstName lastName email avatar role'
      });
    
    res.status(201).json({
      status: 'success',
      data: {
        conversation: populatedConversation
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * Send a message in a conversation
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, attachments } = req.body;
    
    // Validate message content
    if (!text && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Message must contain text or attachments'
      });
    }
    
    // Check if conversation exists and if user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        status: 'fail',
        message: 'Conversation not found'
      });
    }
    
    // Check if user is a participant
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to send messages in this conversation'
      });
    }
    
    // Create the message
    const newMessage = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      text,
      attachments: attachments || []
    });
    
    // Update the conversation's last message and updatedAt
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
      updatedAt: Date.now()
    });
    
    // Populate sender details
    const populatedMessage = await Message.findById(newMessage._id)
      .populate({
        path: 'sender',
        select: 'firstName lastName email avatar role'
      });
    
    res.status(201).json({
      status: 'success',
      data: {
        message: populatedMessage
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * Mark messages as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Check if conversation exists and if user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        status: 'fail',
        message: 'Conversation not found'
      });
    }
    
    // Check if user is a participant
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to access this conversation'
      });
    }
    
    // Mark all unread messages not sent by the user as read
    const result = await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        isRead: false
      },
      {
        isRead: true,
        readAt: Date.now()
      }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        markedAsRead: result.nModified || 0
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

/**
 * Delete a message (only your own)
 */
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        status: 'fail',
        message: 'Message not found'
      });
    }
    
    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can only delete your own messages'
      });
    }
    
    // Check if it's the last message in the conversation
    const conversation = await Conversation.findById(message.conversation);
    
    // Delete the message
    await message.remove();
    
    // If it was the last message, update the conversation's lastMessage
    if (conversation && conversation.lastMessage && 
        conversation.lastMessage.toString() === messageId) {
      // Find the new last message
      const newLastMessage = await Message.findOne(
        { conversation: conversation._id },
        {},
        { sort: { createdAt: -1 } }
      );
      
      await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: newLastMessage ? newLastMessage._id : null
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};
