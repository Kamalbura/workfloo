import React, { useState } from 'react';
import { Bell, Menu, Search, X } from 'lucide-react';
import { Button } from './ui/button';

const AdminHeader = ({ title, toggleSidebar, isSidebarVisible }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [notifications] = useState([
    { id: 1, message: "New employee registration", time: "5 min ago", read: false },
    { id: 2, message: "Task completed by John Doe", time: "1 hour ago", read: false },
    { id: 3, message: "System maintenance scheduled", time: "2 hours ago", read: true }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const unreadNotifications = notifications.filter(n => !n.read).length;
  
  return (
    <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm py-4 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-4 lg:hidden" 
            onClick={toggleSidebar}
          >
            {isSidebarVisible ? <X /> : <Menu />}
          </Button>
          
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white hidden md:block">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {showSearch ? (
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-full md:w-64 bg-gray-100 dark:bg-gray-700 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <button 
                className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                onClick={() => setShowSearch(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
          
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full transform translate-x-1/3 -translate-y-1/3">
                  {unreadNotifications}
                </span>
              )}
            </Button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-medium">Notifications</h3>
                  <Button variant="ghost" size="sm">Mark all as read</Button>
                </div>
                <div className="max-h-96 overflow-auto">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`h-2 w-2 mt-2 mr-3 rounded-full ${!notification.read ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        <div>
                          <p className="text-sm">{notification.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center">
                  <Button variant="link" size="sm">View all notifications</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
