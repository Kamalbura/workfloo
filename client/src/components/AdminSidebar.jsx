import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Settings, 
  Home, 
  LogOut, 
  Calendar,
  FileText,
  Briefcase,
  ChevronDown,
  Activity,
  MessageSquare
} from 'lucide-react';

const AdminSidebar = ({ activePage = 'dashboard' }) => {
  const { user, logout } = useAuth();
  const [showReportMenu, setShowReportMenu] = useState(false);

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <span className="font-bold text-xl">WF</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">Work Flow</h1>
            <span className="text-xs text-gray-400">Admin Dashboard</span>
          </div>
        </div>
      </div>
      
      <div className="p-5 flex-1">
        <h2 className="text-xs uppercase text-gray-500 font-semibold mb-4 tracking-wider">Main</h2>
        
        <nav className="space-y-1">
          <Link to="/admin/dashboard" 
            className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
              activePage === 'dashboard' ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Home className="h-5 w-5 mr-3" />
            Dashboard
          </Link>
          
          <Link to="/admin/tasks" 
            className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
              activePage === 'tasks' ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Briefcase className="h-5 w-5 mr-3" />
            Task Manager
          </Link>
          
          <Link to="/admin/team" 
            className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
              activePage === 'team' ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Users className="h-5 w-5 mr-3" />
            Team Management
          </Link>
          
          <Link to="/admin/calendar" 
            className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
              activePage === 'calendar' ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Calendar className="h-5 w-5 mr-3" />
            Calendar
          </Link>
          
          <div>
            <button
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                showReportMenu || ['reports', 'analytics', 'performance'].includes(activePage) 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              onClick={() => setShowReportMenu(!showReportMenu)}
            >
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-3" />
                Reports
              </div>
              <ChevronDown className={`h-4 w-4 transform transition-transform ${showReportMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showReportMenu && (
              <div className="pl-10 mt-1 space-y-1">
                <Link to="/admin/analytics" 
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    activePage === 'analytics' ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
                <Link to="/admin/performance" 
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    activePage === 'performance' ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Performance
                </Link>
              </div>
            )}
          </div>
          
          <Link to="/admin/messages" 
            className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
              activePage === 'messages' ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <MessageSquare className="h-5 w-5 mr-3" />
            Messages
          </Link>
        </nav>
        
        <h2 className="text-xs uppercase text-gray-500 font-semibold mb-4 mt-8 tracking-wider">System</h2>
        
        <nav className="space-y-1">
          <Link to="/admin/settings" 
            className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
              activePage === 'settings' ? 'bg-violet-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </Link>
          
          <button
            onClick={logout} 
            className="w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </button>
        </nav>
      </div>
      
      <div className="p-5 border-t border-gray-800">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
