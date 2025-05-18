import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import { useToast } from '../components/ui/use-toast';
import { 
  BarChart, 
  PieChart,
  LineChart,
  Line,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Cell,
  Pie
} from 'recharts';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

const AdminAnalyticsPage = () => {
  const { user } = useAuth();
  const { tasks } = useTask();
  const { toast } = useToast();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  // Analytics data
  const [taskStatusData, setTaskStatusData] = useState([]);
  const [taskTrendData, setTaskTrendData] = useState([]);
  const [employeePerformanceData, setEmployeePerformanceData] = useState([]);
  
  const toggleSidebar = () => {
    setIsSidebarVisible(prevState => !prevState);
  };

  // Calculate analytics data
  useEffect(() => {
    if (tasks) {
      // Task status distribution
      const todo = tasks.filter(task => task.status === 'todo').length;
      const inProgress = tasks.filter(task => task.status === 'inprogress').length;
      const completed = tasks.filter(task => task.status === 'completed').length;
      const approved = tasks.filter(task => task.status === 'approved').length;
      
      setTaskStatusData([
        { name: 'To Do', value: todo, fill: '#e0e7ff' },
        { name: 'In Progress', value: inProgress, fill: '#93c5fd' },
        { name: 'Completed', value: completed, fill: '#60a5fa' },
        { name: 'Approved', value: approved, fill: '#3b82f6' }
      ]);
      
      // Task trend over time (last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
      });
      
      const trendData = last7Days.map(date => {
        const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayTasks = tasks.filter(task => {
          const taskDate = new Date(task.createdAt);
          return (
            taskDate.getDate() === date.getDate() &&
            taskDate.getMonth() === date.getMonth() &&
            taskDate.getFullYear() === date.getFullYear()
          );
        });
        
        return {
          date: dateString,
          'New Tasks': dayTasks.length,
          'Completed Tasks': dayTasks.filter(t => t.status === 'completed' || t.status === 'approved').length
        };
      });
      
      setTaskTrendData(trendData);
      
      // Employee performance
      const employeeMap = new Map();
      tasks.forEach(task => {
        if (task.assignee) {
          const employeeId = task.assignee;
          if (!employeeMap.has(employeeId)) {
            employeeMap.set(employeeId, { 
              name: task.assigneeName || employeeId,
              total: 0, 
              completed: 0 
            });
          }
          
          employeeMap.get(employeeId).total += 1;
          if (task.status === 'completed' || task.status === 'approved') {
            employeeMap.get(employeeId).completed += 1;
          }
        }
      });
      
      const employeeData = Array.from(employeeMap.values())
        .map(emp => ({
          name: emp.name,
          'Completion Rate': emp.total > 0 ? Math.round((emp.completed / emp.total) * 100) : 0,
          'Total Tasks': emp.total,
          'Completed Tasks': emp.completed
        }))
        .sort((a, b) => b['Completion Rate'] - a['Completion Rate'])
        .slice(0, 5); // Top 5 employees
      
      setEmployeePerformanceData(employeeData);
    }
  }, [tasks]);

  // Custom colors for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'} fixed lg:relative w-64 z-10 transition-transform duration-300 ease-in-out lg:translate-x-0 h-screen`}>
        <AdminSidebar activePage="analytics" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          title="Analytics & Reports" 
          toggleSidebar={toggleSidebar} 
          isSidebarVisible={isSidebarVisible}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Visualize your organization's performance and task metrics
            </p>
          </div>
          
          {/* Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Task Status Distribution */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Task Status Distribution</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Task Trend */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Task Trend (Last 7 Days)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={taskTrendData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="New Tasks"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line type="monotone" dataKey="Completed Tasks" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Employee Performance */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Employee Performance</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={employeePerformanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Completion Rate" fill="#8884d8" name="Completion Rate (%)" />
                  <Bar dataKey="Total Tasks" fill="#82ca9d" />
                  <Bar dataKey="Completed Tasks" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Total Tasks</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{tasks?.length || 0}</p>
              <div className="flex items-center mt-2">
                <span className="text-green-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  12% increase
                </span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Completion Rate</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {tasks?.length > 0 
                  ? Math.round((tasks.filter(t => t.status === 'completed' || t.status === 'approved').length / tasks.length) * 100)
                  : 0}%
              </p>
              <div className="flex items-center mt-2">
                <span className="text-green-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  5% increase
                </span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Avg. Completion Time</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">2.5 days</p>
              <div className="flex items-center mt-2">
                <span className="text-red-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                  </svg>
                  0.5 day increase
                </span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Overdue Tasks</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {tasks?.filter(t => {
                  if (!t.dueDate) return false;
                  const dueDate = new Date(t.dueDate);
                  return t.status !== 'completed' && 
                         t.status !== 'approved' && 
                         dueDate < new Date();
                }).length || 0}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-red-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                  </svg>
                  2 more since yesterday
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
