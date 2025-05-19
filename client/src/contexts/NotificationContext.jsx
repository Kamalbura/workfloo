import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Bell, MessageSquare } from 'lucide-react';
import { useAuth } from './AuthContext';
import { messageService } from '../services/api';

// Create the notification context
const NotificationContext = createContext();

// Notification types and their configuration
const NOTIFICATION_TYPES = {
  SUCCESS: {
    icon: CheckCircle,
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    iconClass: 'text-green-500 dark:text-green-400',
    borderClass: 'border-green-200 dark:border-green-800/30'
  },
  ERROR: {
    icon: AlertCircle,
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    iconClass: 'text-red-500 dark:text-red-400',
    borderClass: 'border-red-200 dark:border-red-800/30'
  },
  WARNING: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    iconClass: 'text-amber-500 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-800/30'
  },  INFO: {
    icon: Info,
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    iconClass: 'text-blue-500 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-800/30'
  },
  MESSAGE: {
    icon: MessageSquare,
    bgClass: 'bg-violet-50 dark:bg-violet-900/20',
    iconClass: 'text-violet-500 dark:text-violet-400', 
    borderClass: 'border-violet-200 dark:border-violet-800/30'
  }
};

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const pollingIntervalRef = useRef(null);

  // Add a new notification
  const addNotification = (message, type = 'INFO', timeout = 5000) => {
    const id = Date.now();
    const newNotification = {
      id,
      message,
      type,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto remove notification after timeout
    if (timeout !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, timeout);
    }

    return id;
  };

  // Remove a notification by id
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  };
  // Check for new messages
  const checkNewMessages = async () => {
    if (!user) return;
    
    try {
      const response = await messageService.getConversations();
      
      if (response.data && response.data.status === 'success') {
        const conversations = response.data.data.conversations;
        
        // Calculate total unread messages
        const totalUnread = conversations.reduce(
          (total, conv) => total + (conv.unreadCount || 0), 0
        );
        
        // If there are new unread messages since last check
        if (totalUnread > unreadMessageCount) {
          const newMessages = totalUnread - unreadMessageCount;
          
          // Find conversations with unread messages
          const unreadConversations = conversations.filter(conv => conv.unreadCount > 0);
          
          // Create notification for new messages if there are any
          if (newMessages > 0 && unreadConversations.length > 0) {
            // Get the most recent conversation with unread messages
            const recentConversation = unreadConversations[0];
            const sender = recentConversation.participants.find(
              p => p._id !== user._id
            );
            
            const senderName = sender ? 
              `${sender.firstName} ${sender.lastName}` : 
              (recentConversation.name || 'Someone');
            
            const messageText = newMessages === 1 ?
              `New message from ${senderName}` :
              `${newMessages} new messages`;
            
            addNotification(messageText, 'MESSAGE', 8000);
          }
        }
        
        setUnreadMessageCount(totalUnread);
      }
    } catch (err) {
      console.error('Error checking new messages:', err);
    }
  };

  // Setup polling interval for message checks
  useEffect(() => {
    if (user) {
      // Check immediately on login
      checkNewMessages();
      
      // Set up interval for checking (every 30 seconds)
      pollingIntervalRef.current = setInterval(checkNewMessages, 30000);
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Context value
  const value = {
    notifications,
    unreadMessageCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    checkNewMessages, // Make this available so components can force a check
    success: (message, timeout) => addNotification(message, 'SUCCESS', timeout),
    error: (message, timeout) => addNotification(message, 'ERROR', timeout),
    warning: (message, timeout) => addNotification(message, 'WARNING', timeout),
    info: (message, timeout) => addNotification(message, 'INFO', timeout),
    message: (message, timeout) => addNotification(message, 'MESSAGE', timeout)
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

// Hook for using notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification component for a single notification
const NotificationItem = ({ notification, onClose }) => {
  const { id, message, type, timestamp } = notification;
  const notificationType = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.INFO;
  const { icon: Icon, bgClass, iconClass, borderClass } = notificationType;
  
  return (
    <div 
      className={`flex items-start p-4 rounded-lg shadow-md border mb-3 transition-all ${bgClass} ${borderClass}`}
      role="alert"
    >
      <div className={`flex-shrink-0 ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{message}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {new Date(timestamp).toLocaleTimeString()}
        </p>
      </div>
      <button 
        className="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        onClick={() => onClose(id)}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

// Container component that displays all notifications
const NotificationContainer = () => {
  const { notifications, removeNotification } = useContext(NotificationContext);
  const activeNotifications = notifications.filter(n => !n.read).slice(0, 5);

  return (
    <div className="fixed top-0 right-0 p-4 z-50 max-w-sm space-y-2 pointer-events-none">
      {activeNotifications.map(notification => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationItem
            notification={notification}
            onClose={removeNotification}
          />
        </div>
      ))}
    </div>
  );
};

// Notification Panel component to display in modals or sidebars
export const NotificationPanel = ({ onClose }) => {
  const { notifications, markAllAsRead, removeNotification, markAsRead } = useNotifications();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 w-full max-w-md max-h-[80vh] flex flex-col">
      <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-violet-600 dark:text-violet-400 mr-2" />
          <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="ml-2 bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 text-xs font-medium px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        
        <div className="flex items-center">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="mr-3 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300"
            >
              Mark all as read
            </button>
          )}
          
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No notifications</h4>
            <p className="text-gray-500 dark:text-gray-400">You're all caught up! Check back later for updates.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  !notification.read ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {(() => {
                      const { icon: Icon, iconClass } = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.INFO;
                      return <Icon className={`h-5 w-5 ${iconClass}`} />;
                    })()}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {notification.message}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(notification.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Note: We use named export, not default export 
// export default NotificationProvider;
