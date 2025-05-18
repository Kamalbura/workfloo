import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { taskService } from '../services/api';

// Create context
export const TaskContext = createContext(null);

// Hook to use task context
export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

// Task Provider component
export const TaskProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);  // Fetch tasks function that can be called manually
  const fetchTasks = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (user.role === 'admin') {
        // Admin can see all tasks for their organization
        response = await taskService.getAllTasks();
      } else {
        // Employees see only their assigned tasks
        response = await taskService.getMyTasks();
      }      
      console.log('Tasks response:', response);
      
      if (response.data) {
        if (response.data.data && response.data.data.tasks) {
          setTasks(response.data.data.tasks);
        } else if (Array.isArray(response.data.data)) {
          setTasks(response.data.data);
        } else if (Array.isArray(response.data)) {
          setTasks(response.data);
        } else {
          setTasks([]);
        }
        
        // Also check for overdue tasks and update their status
        await checkOverdueTasks();
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.message || 'Failed to fetch tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };
    // Check for overdue tasks
  const checkOverdueTasks = async () => {
    try {
      const response = await taskService.getOverdueTasks();
      if (response.data && response.data.status === 'success') {
        // Update local state if there are overdue tasks
        if (response.data.data && response.data.data.tasks && response.data.data.tasks.length > 0) {
          setTasks(prevTasks => {
            // Replace overdue tasks in the current state
            const updatedTasks = [...prevTasks];
            response.data.data.tasks.forEach(overdueTask => {
              const index = updatedTasks.findIndex(t => t._id === overdueTask._id);
              if (index >= 0) {
                updatedTasks[index] = overdueTask;
              } else {
                // Add the overdue task if it's not already in the list
                updatedTasks.push(overdueTask);
              }
            });
            return updatedTasks;
          });
        }
      }
    } catch (err) {
      console.error('Error checking overdue tasks:', err);
    }
  };

  // Refresh function to trigger task reload
  const refreshTasks = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  // Fetch tasks when authenticated or refreshTrigger changes
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, refreshTrigger]);
    // Set up an interval to periodically check for overdue tasks
  useEffect(() => {
    if (user) {
      // Check for overdue tasks every 5 minutes
      const intervalId = setInterval(() => checkOverdueTasks(), 5 * 60 * 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Create a new task (admin only)
  const createTask = async (taskData) => {
    try {
      const response = await taskService.createTask({
        ...taskData,
        organization_id_slug: user.organizationId
      });
      
      // Trigger refresh
      refreshTasks();
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create task';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update a task
  const updateTask = async (taskId, taskData) => {
    try {
      const response = await taskService.updateTask(taskId, taskData);
      
      // Refresh to get updated data
      refreshTasks();
      
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update task';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update just the status of a task (employee can do this)
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await taskService.updateTaskStatus(taskId, newStatus);
      
      // Update local state
      setTasks(prevTasks => prevTasks.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
      ));
      
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update task status';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Approve a completed task (admin only)
  const approveTask = async (taskId) => {
    try {
      const response = await taskService.approveTask(taskId);
      
      // Update local state
      setTasks(prevTasks => prevTasks.map(task => 
        task._id === taskId ? { ...task, status: 'approved' } : task
      ));
      
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to approve task';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Delete a task (admin only)
  const deleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      
      // Update local state
      setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete task';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Get tasks by status
  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  // Value provided to consumers of this context
  const value = {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    updateTaskStatus,
    approveTask,
    deleteTask,
    getTasksByStatus,
    refreshTasks,
    fetchTasks
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};