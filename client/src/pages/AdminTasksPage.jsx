import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog } from '../components/ui/dialog';
import { 
  Briefcase, 
  CheckCircle, 
  Clock, 
  Filter, 
  Plus, 
  Search,
  AlertCircle,
  ChevronDown,
  Calendar as CalendarIcon,
  XCircle,
  RefreshCw
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import TaskModal from '../components/TaskModal';

const AdminTasksPage = () => {
  const { user } = useAuth();
  const { tasks, getAllTasks, getMyTasks, getOverdueTasks, updateTaskStatus } = useTask();
  const { success } = useNotifications();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [employeeList, setEmployeeList] = useState([]);

  // Get all employees for task assignment (admin only)
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (data.status === 'success') {
          setEmployeeList(data.data.employees);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    if (user?.role === 'admin') {
      fetchEmployees();
    }
  }, [user]);

  // Fetch tasks
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        await getAllTasks();
        success('Tasks loaded successfully');
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load tasks. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [getAllTasks, success, toast]);

  // Filter and sort tasks
  useEffect(() => {
    if (!tasks) return;

    let result = [...tasks];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(query) || 
        (task.description && task.description.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(task => task.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(task => task.priority === priorityFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    setFilteredTasks(result);
  }, [tasks, searchQuery, statusFilter, priorityFilter, sortBy]);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarVisible(prev => !prev);
  };

  // Handle opening the task modal for editing
  const handleEditTask = (task) => {
    setCurrentTask(task);
    setIsTaskModalOpen(true);
  };

  // Handle opening the task modal for creating new task
  const handleNewTask = () => {
    setCurrentTask(null);
    setIsTaskModalOpen(true);
  };

  // Handle task status change
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      success(`Task status updated to ${newStatus}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive'
      });
    }
  };

  // Get color class for priority badge
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get color class for status badge
  const getStatusColor = (status) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'inprogress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'approved':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
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
      {isSidebarVisible && (
        <AdminSidebar activePage="tasks" />
      )}
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          title="Task Manager" 
          toggleSidebar={toggleSidebar} 
          isSidebarVisible={isSidebarVisible} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white flex items-center">
                <Briefcase className="mr-2 h-6 w-6" />
                Task Manager
              </h1>
              
              <Button 
                onClick={handleNewTask} 
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" /> New Task
              </Button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                {/* Search input */}
                <div className="relative w-full md:w-96">
                  <Input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                
                {/* Filter button */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    <ChevronDown className={`h-4 w-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </Button>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dueDate">Due Date</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="createdAt">Created Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Expanded filters */}
              {showFilters && (
                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="inprogress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end gap-2 mt-auto">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setStatusFilter('all');
                        setPriorityFilter('all');
                        setSearchQuery('');
                        setSortBy('dueDate');
                      }}
                    >
                      Reset
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => getOverdueTasks()}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Show Overdue
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Tasks list */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="h-10 w-10 text-violet-600 animate-spin" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                    <Briefcase className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No tasks found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                      ? "No tasks match your current filters."
                      : "You don't have any tasks yet."}
                  </p>
                  {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all') && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setStatusFilter('all');
                        setPriorityFilter('all');
                        setSearchQuery('');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      <tr>
                        <th className="py-3 px-4 text-left">Task</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Priority</th>
                        <th className="py-3 px-4 text-left">Due Date</th>
                        <th className="py-3 px-4 text-left">Assigned To</th>
                        <th className="py-3 px-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredTasks.map(task => (
                        <tr 
                          key={task._id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                        >
                          <td className="py-3 px-4" onClick={() => handleEditTask(task)}>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{task.title}</div>
                              <div className="text-gray-500 dark:text-gray-400 text-sm truncate max-w-[300px]">
                                {task.description || 'No description'}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(task.status)}>
                              {task.status === 'inprogress' 
                                ? 'In Progress' 
                                : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-500 dark:text-gray-400" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {formatDate(task.dueDate)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-2">
                                <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                                  {task.assignedTo?.firstName?.charAt(0) || '?'}
                                  {task.assignedTo?.lastName?.charAt(0) || '?'}
                                </span>
                              </div>
                              <span className="text-gray-700 dark:text-gray-300">
                                {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Select 
                                value={task.status} 
                                onValueChange={(value) => handleStatusChange(task._id, value)}
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue placeholder="Update Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="todo">To Do</SelectItem>
                                  <SelectItem value="inprogress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  {user?.role === 'admin' && (
                                    <SelectItem value="approved">Approved</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditTask(task)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Task modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <TaskModal 
          isOpen={isTaskModalOpen} 
          closeModal={() => setIsTaskModalOpen(false)}
          task={currentTask} 
          employees={employeeList}
        />
      </Dialog>
    </div>
  );
};

export default AdminTasksPage;
