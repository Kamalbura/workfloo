import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { AlertCircle, Check, Clock, Plus, UserPlus, Users } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import KanbanBoard from '../components/KanbanBoard';
import { employeeService } from '../services/api';

const AdminDashboardPage = () => {
  const { user, api } = useAuth();
  const { toast } = useToast();
  const { tasks, loading: tasksLoading } = useTask();
  
  const [employees, setEmployees] = useState([]);
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    totalEmployees: 0,
    pendingApprovals: 0
  });
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        // Get all employees
        const activeResponse = await employeeService.getEmployeesByOrganization();
        
        if (activeResponse.data && activeResponse.data.status === 'success') {
          setEmployees(activeResponse.data.data.employees.filter(emp => emp.status === 'active') || []);
        }
        
        // Get pending employees
        const pendingResponse = await employeeService.getPendingEmployees();
        
        if (pendingResponse.data && pendingResponse.data.status === 'success') {
          setPendingEmployees(pendingResponse.data.data.users || []);
        }
        
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast({
          title: 'Error',
          description: 'Failed to load employees',
          variant: 'destructive',
        });
      } finally {
        setLoadingEmployees(false);
      }
    };
    
    fetchEmployees();
  }, [toast]);
  // Calculate dashboard stats
  useEffect(() => {
    if (tasks) {
      const completed = tasks.filter(task => task.status === 'completed' || task.status === 'approved').length;
      const pending = tasks.filter(task => task.status === 'todo' || task.status === 'inprogress').length;
      const overdue = tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return task.status !== 'completed' && 
               task.status !== 'approved' && 
               dueDate < new Date();
      }).length;
      
      setStats({
        totalTasks: tasks.length,
        completedTasks: completed,
        pendingTasks: pending,
        overdueTasks: overdue,
        totalEmployees: employees.length,
        pendingApprovals: pendingEmployees.length
      });
    }
  }, [tasks, employees, pendingEmployees]);
  // Function to approve an employee
  const approveEmployee = async (employeeId) => {
    try {
      const response = await employeeService.approveEmployee(employeeId);
      
      if (response.data && response.data.status === 'success') {
        // Update local state
        const approved = pendingEmployees.find(emp => emp._id === employeeId);
        setPendingEmployees(prev => prev.filter(emp => emp._id !== employeeId));
        
        if (approved) {
          // Use the updated employee data from the response
          const updatedEmployee = response.data.data.employee;
          setEmployees(prev => [...prev, updatedEmployee]);
        }
        
        toast({
          title: 'Success',
          description: `Employee has been approved with ID: ${response.data.data.employee.employeeId}`,
        });
      } else {
        throw new Error('Failed to approve employee');
      }
    } catch (error) {
      console.error('Error approving employee:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve employee',
        variant: 'destructive',
      });
    }
  };
  // Import KanbanBoard component for task management
  const [currentTask, setCurrentTask] = useState(null);
  
  // Handle opening task modal
  const openTaskModal = (task = null) => {
    setCurrentTask(task);
    setIsAddTaskModalOpen(true);
  };
  // Import TaskModal component for task creation and editing
  //import TaskModal from '../components/TaskModal';
  // Enhanced employee management modal
  const EmployeesModal = () => (
    <div className="modal-overlay">
      <div className="modal-content max-w-3xl">
        <div className="relative mb-6">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/10 rounded-full blur-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Team</h2>
              </div>
              
              <button 
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                onClick={() => setIsEmployeeModalOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Approve new team members and manage your existing workforce</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="flex items-center justify-center w-6 h-6 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold mr-2">
                  {pendingEmployees.length}
                </span>
                Pending Approvals
              </h3>
              {pendingEmployees.length > 0 && (
                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs px-2 py-1 rounded-full">
                  Action needed
                </span>
              )}
            </div>
            
            {pendingEmployees.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-center">No pending approval requests</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {pendingEmployees.map(emp => (
                  <div key={emp._id} className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 transition-all hover:bg-violet-50 dark:hover:bg-violet-900/10 border border-transparent hover:border-violet-100 dark:hover:border-violet-800/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-pink-500 flex items-center justify-center text-white font-bold mr-3">
                          {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{emp.email}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => approveEmployee(emp._id)}
                        className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-sm"
                      >
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold mr-2">
                  {employees.length}
                </span>
                Active Team Members
              </h3>
            </div>
            
            {employees.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-center">No active team members</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {employees.map(emp => (
                  <div key={emp._id} className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold mr-3">
                          {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                          <div className="flex items-center text-sm">
                            <p className="text-gray-500 dark:text-gray-400 mr-3">{emp.email}</p>
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-2 py-0.5 rounded">
                              ID: {emp.employeeId || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="outline" 
            onClick={() => setIsEmployeeModalOpen(false)}
            className="bg-transparent border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );

  if (tasksLoading || loadingEmployees) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }  return (
    <div className="dashboard-container">
      <header className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl shadow-xl p-8 mb-8">
        <div className="absolute inset-0 bg-[url('/assets/pattern-grid.svg')] opacity-10"></div>
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 blur-3xl rounded-full"></div>
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-black/10 blur-3xl rounded-full"></div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-violet-100 mt-2 text-lg">Welcome back, {user?.firstName || 'Admin'}!</p>
            <p className="text-violet-200/80 text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => setIsAddTaskModalOpen(true)}
              className="bg-white/95 text-violet-700 hover:bg-white transition-colors shadow-md px-6 py-5 rounded-xl"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" /> Create New Task
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsEmployeeModalOpen(true)}
              className="bg-violet-500/30 border-white/40 hover:bg-white/20 text-white transition-colors px-6 py-5 rounded-xl"
              size="lg"
            >
              <Users className="h-5 w-5 mr-2" /> Manage Team
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center mt-6 pt-6 border-t border-white/20">
          <div className="mr-8 flex items-center text-violet-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-violet-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Summary
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
              <span>{stats.completedTasks} completed</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-yellow-400 mr-2"></div>
              <span>{stats.pendingTasks} in progress</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-red-400 mr-2"></div>
              <span>{stats.overdueTasks} overdue</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-blue-400 mr-2"></div>
              <span>{stats.totalEmployees} team members</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden">
          <div className="border-b border-violet-100 dark:border-gray-700 p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-700 dark:text-gray-200 font-medium">Tasks Overview</h3>
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalTasks}</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-xl font-bold text-violet-600 dark:text-violet-400 mt-1">{stats.completedTasks}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pendingTasks}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden">
          <div className="border-b border-blue-100 dark:border-gray-700 p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-700 dark:text-gray-200 font-medium">Team Members</h3>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalEmployees}</p>
            {stats.pendingApprovals > 0 ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 flex items-center justify-between mt-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending Approvals</p>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pendingApprovals}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsEmployeeModalOpen(true)} className="h-8">
                  Review
                </Button>
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 flex items-center mt-4">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <p className="text-sm text-green-700 dark:text-green-400">All employees approved</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden">
          <div className="border-b border-green-100 dark:border-gray-700 p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-700 dark:text-gray-200 font-medium">Completion Rate</h3>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completedTasks}</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {Math.round((stats.completedTasks / (stats.totalTasks || 1)) * 100)}%
              </p>
            </div>
            <div className="mt-4">
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                  style={{ width: `${Math.round((stats.completedTasks / (stats.totalTasks || 1)) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden">
          <div className="border-b border-red-100 dark:border-gray-700 p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-gray-700 dark:text-gray-200 font-medium">Overdue Tasks</h3>
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.overdueTasks}</p>
            {stats.overdueTasks > 0 ? (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 flex items-center justify-between mt-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                  <p className="text-sm text-red-700 dark:text-red-400">Requires attention</p>
                </div>
                <Button size="sm" variant="destructive" className="h-8">View All</Button>
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 flex items-center mt-4">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <p className="text-sm text-green-700 dark:text-green-400">No overdue tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>{/* Organization Details */}      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-full mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Organization Overview</h2>
            <p className="text-violet-600 dark:text-violet-400 font-medium">{user?.organization_id_slug || 'Your Organization'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-900/20 dark:to-gray-800 p-5 rounded-xl border border-violet-100 dark:border-violet-800/30 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Admin Manager</h3>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold mr-3 shadow-md">
                {user?.firstName?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 p-5 rounded-xl border border-blue-100 dark:border-blue-800/30 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Team Size</h3>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white mr-3 shadow-md">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{stats.totalEmployees} Members</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active Team</p>
              </div>
            </div>
          </div>
          
          <div className={`bg-gradient-to-br ${stats.pendingApprovals > 0 ? 'from-amber-50 to-white dark:from-amber-900/20' : 'from-green-50 to-white dark:from-green-900/20'} dark:to-gray-800 p-5 rounded-xl border ${stats.pendingApprovals > 0 ? 'border-amber-100 dark:border-amber-800/30' : 'border-green-100 dark:border-green-800/30'} shadow-sm`}>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Pending Approvals</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white mr-3 shadow-md ${stats.pendingApprovals > 0 ? 'bg-gradient-to-br from-amber-500 to-yellow-500' : 'bg-gradient-to-br from-green-500 to-emerald-500'}`}>
                  {stats.pendingApprovals > 0 ? (
                    <span className="font-bold">{stats.pendingApprovals}</span>
                  ) : (
                    <Check className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {stats.pendingApprovals > 0 ? `${stats.pendingApprovals} Approvals` : 'All Approved'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {stats.pendingApprovals > 0 ? 'Needs attention' : 'No pending requests'}
                  </p>
                </div>
              </div>
              
              {stats.pendingApprovals > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsEmployeeModalOpen(true)} 
                  className="h-8 bg-amber-100/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30 text-amber-800 dark:text-amber-300"
                >
                  Review
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>{/* Tasks Kanban Board */}      <div className="mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/30 rounded-xl mr-4 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Task Management</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Track and manage all tasks across your organization
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-4 py-2 rounded-lg text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Drag tasks to update status
            </div>
            <Button 
              onClick={() => setIsAddTaskModalOpen(true)}
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Task
            </Button>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4">
          <KanbanBoard onTaskClick={openTaskModal} />
        </div>
      </div>

      {/* Modals */}
      {isAddTaskModalOpen && (
        <TaskModal 
          isOpen={isAddTaskModalOpen} 
          closeModal={() => setIsAddTaskModalOpen(false)} 
          currentTask={currentTask}
        />
      )}
      {isEmployeeModalOpen && <EmployeesModal />}
    </div>
  );
};

export default AdminDashboardPage;
