import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { messageService } from '../services/api';
import { useNotifications } from './NotificationContext';

// Create context
export const MessageContext = createContext(null);

// Hook to use message context
export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

// Message Provider component
export const MessageProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { success, error } = useNotifications();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);  
  
  // Fetch conversations function
  const fetchConversations = async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      const response = await messageService.getConversations();      
      
      if (response.data && response.data.status === 'success') {
        setConversations(response.data.data.conversations);
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      error('Failed to load conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch messages for active conversation
  const fetchMessages = async (conversationId, page = 1, limit = 50) => {
    if (!conversationId || !user) return;
    
    setMessageLoading(true);
    
    try {
      const response = await messageService.getConversationMessages(conversationId, page, limit);
      
      if (response.data && response.data.status === 'success') {
        setActiveMessages(response.data.data.messages);
        
        // Mark messages as read
        await messageService.markAsRead(conversationId);
        
        // Update conversation list to reflect read status
        setConversations(prev => 
          prev.map(conv => 
            conv._id === conversationId 
              ? { ...conv, unreadCount: 0 } 
              : conv
          )
        );
      } else {
        setActiveMessages([]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      error('Failed to load messages');
      setActiveMessages([]);
    } finally {
      setMessageLoading(false);
    }
  };
  
  // Create a new conversation
  const createConversation = async (participants, name, type = 'private') => {
    try {
      const response = await messageService.createConversation({
        participants,
        name,
        type
      });
      
      if (response.data && response.data.status === 'success') {
        // Refresh conversations
        refreshConversations();
        return { 
          success: true, 
          data: response.data.data.conversation 
        };
      } else {
        return { 
          success: false, 
          error: 'Failed to create conversation' 
        };
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'An error occurred' 
      };
    }
  };
  
  // Send a message
  const sendMessage = async (conversationId, text, attachments = []) => {
    try {
      const response = await messageService.sendMessage(conversationId, {
        text,
        attachments
      });
      
      if (response.data && response.data.status === 'success') {
        // Add to active messages
        setActiveMessages(prev => [...prev, response.data.data.message]);
        
        // Update conversation list
        setConversations(prev => 
          prev.map(conv => 
            conv._id === conversationId 
              ? { 
                  ...conv, 
                  lastMessage: response.data.data.message,
                  updatedAt: new Date().toISOString()
                } 
              : conv
          )
        );
        
        return { 
          success: true, 
          data: response.data.data.message 
        };
      } else {
        return { 
          success: false, 
          error: 'Failed to send message' 
        };
      }
    } catch (err) {
      console.error('Error sending message:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'An error occurred' 
      };
    }
  };
  
  // Delete a message
  const deleteMessage = async (messageId) => {
    try {
      const response = await messageService.deleteMessage(messageId);
      
      if (response.data && response.data.status === 'success') {
        // Remove from active messages
        setActiveMessages(prev => prev.filter(msg => msg._id !== messageId));
        
        // Refresh conversations to update last message
        refreshConversations();
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: 'Failed to delete message' 
        };
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'An error occurred' 
      };
    }
  };
  
  // Refresh conversations function
  const refreshConversations = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Set active conversation and load its messages
  const setConversationActive = async (conversation) => {
    setActiveConversation(conversation);
    if (conversation) {
      await fetchMessages(conversation._id);
    } else {
      setActiveMessages([]);
    }
  };
  
  // Fetch conversations when authenticated or refreshTrigger changes
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Interval to check for new messages (every 30 seconds)
  useEffect(() => {
    if (user) {
      const intervalId = setInterval(() => {
        fetchConversations();
        
        // Also refresh active conversation messages if there is one
        if (activeConversation) {
          fetchMessages(activeConversation._id);
        }
      }, 30000); // 30 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [user, activeConversation]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Value provided to consumers of this context
  const value = {
    conversations,
    activeConversation,
    activeMessages,
    loading,
    messageLoading,
    setConversationActive,
    createConversation,
    sendMessage,
    deleteMessage,
    refreshConversations,
    fetchMessages
  };

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
};
