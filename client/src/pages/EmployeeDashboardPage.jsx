import React, { useState, useEffect } from 'react';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import TaskModal from '../components/TaskModal';
import { FaTasks, FaCheck, FaClock, FaBell } from 'react-icons/fa';
import { useToast } from '../components/ui/use-toast';

const EmployeeDashboardPage = () => {
  const { user } = useAuth();
  const { tasks, loading, error } = useTask();
  const { toast } = useToast();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    dueToday: 0
  });

  // Calculate task statistics
  useEffect(() => {
    if (tasks) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const completed = tasks.filter(task => task.status === 'completed' || task.status === 'approved').length;
      const pending = tasks.filter(task => task.status === 'todo' || task.status === 'inprogress').length;
        // Find tasks due today
      const dueToday = tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      }).length;
      
      setStats({
        total: tasks.length,
        completed,
        pending,
        dueToday
      });
    }
  }, [tasks]);

  // Handle opening the task modal
  const handleOpenTaskModal = (task = null) => {
    setCurrentTask(task);
    setIsTaskModalOpen(true);
  };

  // Handle closing the task modal
  const handleCloseTaskModal = () => {
    setCurrentTask(null);
    setIsTaskModalOpen(false);
  };

  // Render loading spinner
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render error message
  if (error) {
    toast({
      title: "Error",
      description: error,
      variant: "destructive"
    });
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Employee Dashboard</h1>
            <p className="text-blue-100 mt-1">
              Welcome back, {user?.firstName} {user?.lastName}!
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
            <div className="text-blue-50 text-sm font-medium">
              Employee ID: {user?.employeeId || 'Not approved yet'}
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-gray-700 font-medium">Total Tasks</div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="mt-2 text-sm text-gray-600">
            All assigned tasks in your queue
          </div>
        </div>
        
        <div className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-gray-700 font-medium">Completed</div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.completed}</div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${Math.round((stats.completed / (stats.total || 1)) * 100)}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {Math.round((stats.completed / (stats.total || 1)) * 100)}% completion rate
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-gray-700 font-medium">In Progress</div>
            <div className="p-3 bg-amber-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.pending}</div>
          <div className="mt-2 text-sm text-gray-600">
            Tasks currently in progress
          </div>
        </div>
        
        <div className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-gray-700 font-medium">Due Today</div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.dueToday}</div>
          <div className="flex items-center mt-2">
            {stats.dueToday > 0 ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <span className="h-2 w-2 rounded-full bg-red-400 mr-1"></span>
                Requires immediate attention
              </span>
            ) : (
              <span className="text-sm text-green-600 flex items-center">
                <svg className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Nothing due today
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">My Tasks</h2>
          </div>
          <div className="text-sm text-gray-500">
            Drag tasks to change their status
          </div>
        </div>
        <KanbanBoard onTaskClick={handleOpenTaskModal} />
      </div>

      {/* Task Modal */}
      <TaskModal 
        isOpen={isTaskModalOpen} 
        closeModal={handleCloseTaskModal} 
        currentTask={currentTask}
      />
    </div>
  );
};

export default EmployeeDashboardPage;
