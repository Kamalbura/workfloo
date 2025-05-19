import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog } from '../components/ui/dialog';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Plus,
  Users,
  RefreshCw
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from 'date-fns';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import TaskModal from '../components/TaskModal';

const AdminCalendarPage = () => {
  const { user } = useAuth();
  const { tasks, getAllTasks } = useTask();
  const { success } = useNotifications();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [employeeList, setEmployeeList] = useState([]);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [showingEmployee, setShowingEmployee] = useState('all');
  const [viewType, setViewType] = useState('month'); // month, week, day

  // Get all employees (admin only)
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
        success('Calendar data loaded successfully');
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

  // Process tasks for calendar
  useEffect(() => {
    if (!tasks) return;

    let filteredTasks = [...tasks];

    // Filter by employee if needed
    if (showingEmployee !== 'all') {
      filteredTasks = filteredTasks.filter(task => 
        task.assignedTo && task.assignedTo._id === showingEmployee
      );
    }

    // Only include tasks with due dates
    filteredTasks = filteredTasks.filter(task => task.dueDate);

    setCalendarTasks(filteredTasks);
  }, [tasks, showingEmployee]);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarVisible(prev => !prev);
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Handle creating a new task on a specific date
  const handleNewTask = (date) => {
    setSelectedDate(date);
    setCurrentTask({
      dueDate: format(date, 'yyyy-MM-dd')
    });
    setIsTaskModalOpen(true);
  };

  // Handle editing a task
  const handleEditTask = (task) => {
    setCurrentTask(task);
    setIsTaskModalOpen(true);
  };

  // Get color class for priority
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-600 hover:bg-red-700';
      case 'high':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'medium':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'low':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Render the calendar header
  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>

          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            onClick={goToToday}
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </Button>

              {employeeList.length > 0 && (
                <select
                  className="border rounded-md px-3 py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={showingEmployee}
                  onChange={(e) => setShowingEmployee(e.target.value)}
                >
                  <option value="all">All Employees</option>
                  {employeeList.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex border rounded-md overflow-hidden">
            <button
              className={`px-3 py-1 ${viewType === 'month' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              onClick={() => setViewType('month')}
            >
              Month
            </button>
            <button
              className={`px-3 py-1 ${viewType === 'week' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              onClick={() => setViewType('week')}
            >
              Week
            </button>
            <button
              className={`px-3 py-1 ${viewType === 'day' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              onClick={() => setViewType('day')}
            >
              Day
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render days of week header
  const renderDays = () => {
    const days = [];
    const start = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="font-medium text-center py-2">
          {format(addDays(start, i), 'EEE')}
        </div>
      );
    }

    return <div className="grid grid-cols-7 border-b dark:border-gray-700">{days}</div>;
  };

  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    return calendarTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return isSameDay(taskDate, date);
    });
  };

  // Render monthly calendar cells
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const tasksForDay = getTasksForDate(currentDay);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());
        const isSelected = isSameDay(day, selectedDate);

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] p-2 border dark:border-gray-700 ${
              !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500' : ''
            } ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${
              isSelected ? 'ring-2 ring-violet-500 dark:ring-violet-600' : ''
            }`}
            onClick={() => setSelectedDate(currentDay)}
          >
            <div className="flex justify-between items-center mb-1">
              <span className={`text-sm ${isToday ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`}>
                {format(day, 'd')}
              </span>
              {isCurrentMonth && (
                <button
                  className="text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNewTask(currentDay);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="space-y-1 overflow-y-auto max-h-[80px]">
              {tasksForDay.map(task => (
                <div
                  key={task._id}
                  className={`text-xs px-2 py-1 rounded-md text-white cursor-pointer ${getPriorityColor(task.priority)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTask(task);
                  }}
                >
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="space-y-0">{rows}</div>;
  };

  // Render weekly view
  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate);
    const days = [];

    for (let i = 0; i < 7; i++) {
      const currentDay = addDays(weekStart, i);
      const tasksForDay = getTasksForDate(currentDay);
      const isToday = isSameDay(currentDay, new Date());
      
      days.push(
        <div key={i} className="flex flex-col">
          <div className={`py-2 px-4 text-center ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 font-bold' : 'bg-gray-50 dark:bg-gray-800'}`}>
            <div>{format(currentDay, 'EEE')}</div>
            <div className={`text-lg ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>{format(currentDay, 'd')}</div>
          </div>
          <div className="flex-1 p-2 space-y-2 min-h-[400px] border-r dark:border-gray-700">
            {tasksForDay.map(task => (
              <div
                key={task._id}
                className={`p-2 rounded-md text-white cursor-pointer ${getPriorityColor(task.priority)}`}
                onClick={() => handleEditTask(task)}
              >
                <div className="font-medium">{task.title}</div>
                <div className="text-xs opacity-90">
                  {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned'}
                </div>
              </div>
            ))}
            <button
              className="w-full mt-2 text-center text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 text-sm"
              onClick={() => handleNewTask(currentDay)}
            >
              <Plus className="inline h-4 w-4 mr-1" />
              Add Task
            </button>
          </div>
        </div>
      );
    }

    return <div className="grid grid-cols-7 border dark:border-gray-700">{days}</div>;
  };

  // Render day view
  const renderDayView = () => {
    const tasksForDay = getTasksForDate(selectedDate);
    
    return (
      <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 py-3 px-4 border-b dark:border-gray-700">
          <div className="text-xl font-medium">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
        
        <div className="p-4 min-h-[500px]">
          {tasksForDay.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tasks scheduled for this day</p>
              <Button
                className="mt-4"
                onClick={() => handleNewTask(selectedDate)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasksForDay.map(task => (
                <div
                  key={task._id}
                  className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/70 cursor-pointer"
                  onClick={() => handleEditTask(task)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{task.title}</h3>
                      {task.description && (
                        <p className="text-gray-600 dark:text-gray-300 mt-1">{task.description}</p>
                      )}
                    </div>
                    <Badge className={`${getPriorityColor(task.priority)} text-white`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned'}
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Status: {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                className="w-full mt-4"
                variant="outline"
                onClick={() => handleNewTask(selectedDate)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Task
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      {isSidebarVisible && (
        <AdminSidebar activePage="calendar" />
      )}
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          title="Calendar" 
          toggleSidebar={toggleSidebar} 
          isSidebarVisible={isSidebarVisible} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white flex items-center">
                <CalendarIcon className="mr-2 h-6 w-6" />
                Calendar
              </h1>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="h-10 w-10 text-violet-600 animate-spin" />
                </div>
              ) : (
                <>
                  {renderHeader()}
                  
                  {viewType === 'month' && (
                    <>
                      {renderDays()}
                      {renderCells()}
                    </>
                  )}
                  
                  {viewType === 'week' && renderWeekView()}
                  
                  {viewType === 'day' && renderDayView()}
                </>
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

export default AdminCalendarPage;
