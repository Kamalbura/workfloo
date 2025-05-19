import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  Search, 
  RefreshCw,
  PlusCircle, 
  Phone,
  Video,
  Info,
  File,
  Image,
  Smile,
  Paperclip
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

// Mock data for conversations (to be replaced with API)
const mockConversations = [
  {
    id: 'c1',
    type: 'private',
    participants: [
      { id: 'u2', name: 'John Smith', avatar: null, online: true }
    ],
    lastMessage: {
      text: 'When will the project be completed?',
      time: '10:24 AM',
      unread: true
    },
  },
  {
    id: 'c2',
    type: 'private',    participants: [
      { id: 'u3', name: 'Sarah Johnson', avatar: null, online: false }
    ],
    lastMessage: {
      text: "I've uploaded all the assets you requested",
      time: '9:45 AM',
      unread: false
    },
  },
  {
    id: 'c3',
    type: 'group',
    name: 'Design Team',
    participants: [
      { id: 'u3', name: 'Sarah Johnson', avatar: null, online: false },
      { id: 'u4', name: 'Alex Wong', avatar: null, online: true },
      { id: 'u5', name: 'Maria Garcia', avatar: null, online: true },
    ],
    lastMessage: {
      text: 'Meeting at 3 PM to discuss the new dashboard layout',
      sender: 'Maria Garcia',
      time: 'Yesterday',
      unread: true
    },
  },
  {
    id: 'c4',
    type: 'private',
    participants: [
      { id: 'u6', name: 'David Lee', avatar: null, online: true }
    ],
    lastMessage: {
      text: 'Can you help me with the database issue?',
      time: 'Yesterday',
      unread: false
    },
  },
];

// Mock messages for selected conversation
const mockMessages = [
  {
    id: 'm1',
    sender: { id: 'u2', name: 'John Smith' },
    text: 'Hello! How is the project going?',
    time: '10:00 AM',
    isOwn: false
  },
  {
    id: 'm2',
    sender: { id: 'u1', name: 'Me' },
    text: 'Hi John! It\'s going well. We\'re almost done with the first phase.',
    time: '10:05 AM',
    isOwn: true
  },
  {
    id: 'm3',
    sender: { id: 'u2', name: 'John Smith' },
    text: 'That\'s great news! When do you think we\'ll be able to start the second phase?',
    time: '10:15 AM',
    isOwn: false
  },
  {
    id: 'm4',
    sender: { id: 'u1', name: 'Me' },
    text: 'Probably by the end of the week. I need to finalize a few things first.',
    time: '10:18 AM',
    isOwn: true
  },
  {
    id: 'm5',
    sender: { id: 'u2', name: 'John Smith' },
    text: 'Sounds good. Let me know if you need any help or resources.',
    time: '10:20 AM',
    isOwn: false
  },
  {
    id: 'm6',
    sender: { id: 'u2', name: 'John Smith' },
    text: 'When will the project be completed?',
    time: '10:24 AM',
    isOwn: false
  },
];

const AdminMessagesPage = () => {
  const { user } = useAuth();
  const { success } = useNotifications();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState(mockConversations);
  const [filteredConversations, setFilteredConversations] = useState(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isNewConversation, setIsNewConversation] = useState(false);
  const messagesEndRef = useRef(null);

  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }
    
    const filtered = conversations.filter(conv => {
      if (conv.type === 'group' && conv.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true;
      }
      
      return conv.participants.some(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    
    setFilteredConversations(filtered);
  }, [searchQuery, conversations]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      // In a real application, this would be an API call
      setLoading(true);
      setTimeout(() => {
        setMessages(mockMessages);
        setLoading(false);
      }, 500);
    }
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarVisible(prev => !prev);
  };

  // Handle sending a message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;
    
    // In a real app, this would send the message via an API
    const newMessage = {
      id: `m${Date.now()}`,
      sender: { id: user._id, name: 'Me' },
      text: messageInput,
      time: format(new Date(), 'h:mm a'),
      isOwn: true
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');
    
    // Update last message in conversation
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation 
          ? {
              ...conv,
              lastMessage: {
                text: messageInput,
                time: 'Just now',
                unread: false
              }
            }
          : conv
      )
    );
    
    success('Message sent');
  };

  // Select a conversation
  const handleSelectConversation = (id) => {
    setSelectedConversation(id);
    setIsNewConversation(false);
    
    // Mark conversation as read
    setConversations(prev => 
      prev.map(conv => 
        conv.id === id 
          ? {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                unread: false
              }
            }
          : conv
      )
    );
  };

  // Format timestamp
  const format = (date, formatStr) => {
    // This is a simplified version, in a real app you might use date-fns
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get conversation name for display
  const getConversationName = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.name;
    }
    
    return conversation.participants[0].name;
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      {isSidebarVisible && (
        <AdminSidebar activePage="messages" />
      )}
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          title="Messages" 
          toggleSidebar={toggleSidebar} 
          isSidebarVisible={isSidebarVisible} 
        />
        
        <main className="flex-1 flex overflow-hidden">
          {/* Conversations list */}
          <div className="w-80 border-r dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
            
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white">Messages</h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                onClick={() => {
                  setIsNewConversation(true);
                  setSelectedConversation(null);
                  setMessages([]);
                }}
              >
                <PlusCircle className="h-5 w-5" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No conversations found
                </div>
              ) : (
                <div className="divide-y dark:divide-gray-700">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        selectedConversation === conv.id ? 'bg-violet-50 dark:bg-violet-900/20' : ''
                      }`}
                      onClick={() => handleSelectConversation(conv.id)}
                    >
                      <div className="flex items-start">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                            {conv.type === 'group' 
                              ? '#' 
                              : getInitials(conv.participants[0].name)
                            }
                          </div>
                          {conv.type === 'private' && conv.participants[0].online && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800"></div>
                          )}
                        </div>
                        
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                              {getConversationName(conv)}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {conv.lastMessage.time}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {conv.type === 'group' && conv.lastMessage.sender && (
                              <span className="font-medium">{conv.lastMessage.sender}: </span>
                            )}
                            {conv.lastMessage.text}
                          </p>
                          
                          <div className="mt-1 flex items-center">
                            {conv.lastMessage.unread && (
                              <Badge className="bg-violet-600 text-white h-5 w-5 rounded-full p-0 flex items-center justify-center">
                                •
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Message view */}
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
            {!selectedConversation && !isNewConversation ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="h-20 w-20 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center mb-4">
                  <MessageSquare className="h-10 w-10 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Your Messages</h3>
                <p className="text-center text-gray-500 dark:text-gray-400 max-w-md mb-6">
                  Select a conversation to start messaging or create a new one.
                </p>
                <Button
                  onClick={() => setIsNewConversation(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Conversation
                </Button>
              </div>
            ) : isNewConversation ? (
              <div className="flex-1 flex flex-col">
                <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex items-center justify-between">
                  <h3 className="font-medium text-lg text-gray-900 dark:text-white">New Conversation</h3>
                </div>
                
                <div className="p-6 flex-1">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-lg mx-auto">
                    <h4 className="font-medium text-lg text-gray-900 dark:text-white mb-4">
                      Start a new conversation
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Recipient Type
                        </label>
                        <div className="flex gap-4">
                          <button className="flex-1 py-2 px-4 bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 font-medium rounded-md">
                            Direct Message
                          </button>
                          <button className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md">
                            Create Group
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Select Recipients
                        </label>
                        <Input
                          type="text"
                          placeholder="Search users..."
                          className="mb-2"
                        />
                        <div className="max-h-40 overflow-y-auto border dark:border-gray-700 rounded-md divide-y dark:divide-gray-700">
                          {[
                            { id: 'u2', name: 'John Smith', role: 'Frontend Developer' },
                            { id: 'u3', name: 'Sarah Johnson', role: 'UI/UX Designer' },
                            { id: 'u4', name: 'Alex Wong', role: 'Backend Developer' },
                            { id: 'u5', name: 'Maria Garcia', role: 'Project Manager' }
                          ].map(u => (
                            <div key={u.id} className="p-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium mr-3">
                                {getInitials(u.name)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {u.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {u.role}
                                </div>
                              </div>
                              <div className="ml-auto">
                                <PlusCircle className="h-5 w-5 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                          Start Conversation
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : loading ? (
              <div className="flex-1 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-violet-600 animate-spin" />
              </div>
            ) : (
              <>
                {/* Conversation header */}
                <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex items-center justify-between">
                  {selectedConversation && (
                    <>
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium mr-3">
                          {getInitials(getConversationName(conversations.find(c => c.id === selectedConversation)))}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {getConversationName(conversations.find(c => c.id === selectedConversation))}
                          </h3>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {conversations.find(c => c.id === selectedConversation).type === 'group'
                              ? `${conversations.find(c => c.id === selectedConversation).participants.length} participants`
                              : conversations.find(c => c.id === selectedConversation).participants[0].online
                                ? 'Online'
                                : 'Offline'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Phone className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Video className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Info className="h-5 w-5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${message.isOwn ? 'order-2' : 'order-1'}`}>
                          {!message.isOwn && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 ml-2">
                              {message.sender.name}
                            </div>
                          )}
                          <div className={`rounded-lg px-4 py-2 inline-block ${
                            message.isOwn 
                              ? 'bg-violet-600 text-white' 
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border dark:border-gray-700'
                          }`}>
                            {message.text}
                          </div>
                          <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                            message.isOwn ? 'text-right mr-2' : 'ml-2'
                          }`}>
                            {message.time}
                          </div>
                        </div>
                        
                        {!message.isOwn && (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium mr-2 mt-6">
                            {getInitials(message.sender.name)}
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Message input */}
                <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 dark:text-gray-400"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    
                    <Input
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1"
                    />
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 dark:text-gray-400"
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                    
                    <Button
                      type="submit"
                      className="bg-violet-600 hover:bg-violet-700 text-white"
                      disabled={!messageInput.trim()}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminMessagesPage;
