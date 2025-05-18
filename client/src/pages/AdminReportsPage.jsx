import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Calendar,
  Clock, 
  Download,
  FileText, 
  Filter,
  Printer,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useNotifications } from '../contexts/NotificationContext';

const AdminReportsPage = () => {
  const { user } = useAuth();
  const { tasks } = useTask();
  const { toast } = useToast();
  const { success } = useNotifications();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('thisWeek'); // all, today, thisWeek, thisMonth
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const toggleSidebar = () => {
    setIsSidebarVisible(prevState => !prevState);
  };

  // Generate today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Generate start of week in YYYY-MM-DD format
  const getStartOfWeek = () => {
    const date = new Date();
    const day = date.getDay(); // 0-6, where 0 is Sunday
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to get Monday
    return new Date(date.setDate(diff)).toISOString().split('T')[0];
  };
  
  // Generate start of month in YYYY-MM-DD format
  const getStartOfMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  };
  
  // Filter tasks based on date range and search query
  const getFilteredTasks = () => {
    if (!tasks) return [];
    
    let filteredTasks = [...tasks];
    
    // Apply date filter
    if (dateFilter !== 'all') {
      let startDate;
      
      if (dateFilter === 'today') {
        startDate = new Date(today);
      } else if (dateFilter === 'thisWeek') {
        startDate = new Date(getStartOfWeek());
      } else if (dateFilter === 'thisMonth') {
        startDate = new Date(getStartOfMonth());
      }
      
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= startDate;
      });
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(query) || 
        (task.description && task.description.toLowerCase().includes(query)) ||
        (task.assigneeName && task.assigneeName.toLowerCase().includes(query))
      );
    }
    
    return filteredTasks;
  };
  
  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call to refresh data
    setTimeout(() => {
      success('Report data refreshed');
      setLoading(false);
    }, 1000);
  };
  
  const handleExport = (format) => {
    success(`Report exported as ${format.toUpperCase()}`);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  // Task status statistics
  const getTaskStats = () => {
    const filteredTasks = getFilteredTasks();
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => 
      t.status === 'completed' || t.status === 'approved'
    ).length;
    const inProgress = filteredTasks.filter(t => 
      t.status === 'inprogress'
    ).length;
    const todo = filteredTasks.filter(t => 
      t.status === 'todo'
    ).length;
    const overdue = filteredTasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return (t.status !== 'completed' && t.status !== 'approved') && dueDate < new Date();
    }).length;
    
    return {
      total,
      completed,
      inProgress,
      todo,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'} fixed lg:relative w-64 z-10 transition-transform duration-300 ease-in-out lg:translate-x-0 h-screen`}>
        <AdminSidebar activePage="reports" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          title="Reports" 
          toggleSidebar={toggleSidebar} 
          isSidebarVisible={isSidebarVisible}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 print:p-0">
          <div className="mb-8 print:hidden">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Activity</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Generate and view detailed reports of your organization's performance
            </p>
          </div>
          
          <Tabs defaultValue="tasks" className="w-full print:hidden">
            <div className="flex justify-between items-center mb-6">
              <TabsList className="bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
                <TabsTrigger value="tasks" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  <FileText className="h-4 w-4 mr-2" />
                  Task Reports
                </TabsTrigger>
                <TabsTrigger value="employee" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  Employee Activity
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                  onClick={() => setShowSearch(!showSearch)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {showSearch ? 'Hide Search' : 'Search'}
                </Button>
              </div>
            </div>
            
            {showSearch && (
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="flex-1 mr-4">
                    <input
                      type="text"
                      placeholder="Search reports..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <select
                      className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="thisWeek">This Week</option>
                      <option value="thisMonth">This Month</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Filter className="h-4 w-4 mr-1" />
                  Filtering: {searchQuery ? `"${searchQuery}" in ` : ''}
                  {dateFilter === 'all' ? 'All Time' : 
                   dateFilter === 'today' ? 'Today' :
                   dateFilter === 'thisWeek' ? 'This Week' : 'This Month'}
                </div>
              </div>
            )}
            
            {/* Task Reports Tab */}
            <TabsContent value="tasks" className="space-y-8">
              {/* Report Header */}
              <div className="flex justify-between items-start print:block print:mt-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white print:text-3xl">Task Activity Report</h2>
                  <p className="text-gray-500 dark:text-gray-400 print:text-lg">
                    {dateFilter === 'all' ? 'All Time' : 
                     dateFilter === 'today' ? 'Today' :
                     dateFilter === 'thisWeek' ? 'This Week' : 'This Month'}
                  </p>
                </div>
                <div className="flex space-x-2 print:hidden">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                    onClick={() => handleExport('csv')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                    onClick={() => handleExport('pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                    onClick={handlePrint}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 print:grid-cols-5">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm print:border print:border-gray-200">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{getTaskStats().total}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm print:border print:border-gray-200">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{getTaskStats().completed}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm print:border print:border-gray-200">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{getTaskStats().inProgress}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm print:border print:border-gray-200">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">To Do</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{getTaskStats().todo}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm print:border print:border-gray-200">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{getTaskStats().overdue}</p>
                </div>
              </div>
              
              {/* Completion Rate */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm print:border print:border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Completion Rate</h3>
                  <Badge variant={getTaskStats().completionRate > 70 ? 'success' : getTaskStats().completionRate > 40 ? 'warning' : 'destructive'}>
                    {getTaskStats().completionRate}%
                  </Badge>
                </div>
                
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div 
                    className={`h-3 rounded-full ${
                      getTaskStats().completionRate > 70 ? 'bg-green-500' : 
                      getTaskStats().completionRate > 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${getTaskStats().completionRate}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              
              {/* Tasks Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden print:border print:border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white p-6 pb-4">Task Details</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Task
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Assignee
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Created
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Due Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {getFilteredTasks().map(task => (
                        <tr key={task._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs truncate">
                              {task.description || 'No description'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-gray-300">{task.assigneeName || 'Unassigned'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                              ${task.status === 'completed' || task.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                task.status === 'inprogress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                                'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`
                            }>
                              {task.status === 'todo' ? 'To Do' : 
                               task.status === 'inprogress' ? 'In Progress' :
                               task.status === 'completed' ? 'Completed' : 'Approved'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(task.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {task.dueDate ? (
                              <span className={`flex items-center ${
                                new Date(task.dueDate) < new Date() && 
                                (task.status !== 'completed' && task.status !== 'approved')
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                <Clock className="h-4 w-4 mr-1" />
                                {formatDate(task.dueDate)}
                              </span>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">No due date</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {getFilteredTasks().length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <p className="text-gray-500 dark:text-gray-400">No tasks match your filter criteria</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            
            {/* Employee Activity Tab */}
            <TabsContent value="employee">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Employee Activity</h3>
                
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 mb-4">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Employee Activity Report</h4>
                  <p className="text-gray-500 dark:text-gray-400">
                    More detailed employee activity reporting will be available in the next update.
                  </p>
                  <Button className="bg-violet-600 hover:bg-violet-700 mt-6">Sign Up for Updates</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Print-only content */}
          <div className="hidden print:block mt-8 text-sm text-gray-500">
            <p>Generated: {new Date().toLocaleString()}</p>
            <p>Organization: {user?.organizationName || 'Work Flow'}</p>
            <p>Generated by: {user?.firstName} {user?.lastName}</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminReportsPage;
