import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  // Login user
  login: (data) => api.post('/auth/login', data),
  
  // Register user
  register: (data) => api.post('/auth/register', data),
    // Get user profile
  getUserProfile: () => api.get('/auth/me'),
  
  // Update profile
  updateProfile: (data) => api.put('/auth/profile', data),
  
  // Change password
  changePassword: (data) => api.put('/auth/change-password', data)
};

// Task Service
export const taskService = {
  // Get all tasks (filtered by user role)
  getAllTasks: () => api.get('/tasks'),
  
  // Get tasks for organization - for backward compatibility
  getTasksByOrganization: () => api.get('/tasks'),
  
  // Get tasks assigned to an employee - for backward compatibility
  getTasksByEmployee: () => api.get('/tasks/my-tasks'),
  
  // Get user's tasks
  getMyTasks: () => api.get('/tasks/my-tasks'),
  
  // Get overdue tasks
  getOverdueTasks: () => api.get('/tasks/overdue'),
  
  // Create a new task (admin)
  createTask: (data) => api.post('/tasks', data),
  
  // Get a task by ID
  getTaskById: (taskId) => api.get(`/tasks/${taskId}`),
  
  // Update a task (admin)
  updateTask: (taskId, data) => api.put(`/tasks/${taskId}`, data),
  
  // Update just the status of a task (employee can do this)
  updateTaskStatus: (taskId, status) => api.patch(`/tasks/${taskId}/status`, { status }),
  
  // Approve a completed task (admin)
  approveTask: (taskId) => api.patch(`/tasks/${taskId}/approve`),
  
  // Delete a task (admin)
  deleteTask: (taskId) => api.delete(`/tasks/${taskId}`)
};

// Employee Service
export const employeeService = {
  // Get all employees for an organization (admin)
  getEmployeesByOrganization: () => api.get('/employees'),
  
  // Get pending employee approvals (admin)
  getPendingEmployees: () => api.get('/auth/pending-approvals'),
    
  // Approve a pending employee (admin)
  approveEmployee: (employeeId) => api.put(`/approve/employee/${employeeId}`),
  
  // Reject a pending employee (admin)
  rejectEmployee: (employeeId) => api.put(`/auth/reject-user/${employeeId}`),
  
  // Update an employee's role (admin)
  updateEmployeeRole: (employeeId, role) => api.patch(`/employees/${employeeId}/role`, { role }),
  
  // Delete an employee (admin)
  deleteEmployee: (employeeId) => api.delete(`/employees/${employeeId}`)
};

// Organization Service
export const organizationService = {
  // Get organization details
  getOrganization: (orgId) => api.get(`/organizations/${orgId}`),
  
  // Update organization details (admin)
  updateOrganization: (orgId, data) => api.put(`/organizations/${orgId}`, data),
  
  // Get organization statistics (admin)
  getOrganizationStats: (orgId) => api.get(`/organizations/${orgId}/stats`),
  
  // Get available organizations for registration (public)
  getAvailableOrganizations: () => api.get('/organizations/available')
};

// Message Service
export const messageService = {
  // Get all conversations for current user
  getConversations: () => api.get('/messages/conversations'),
  
  // Get messages for a specific conversation
  getConversationMessages: (conversationId, page = 1, limit = 50) => 
    api.get(`/messages/conversations/${conversationId}?page=${page}&limit=${limit}`),
  
  // Create a new conversation
  createConversation: (data) => api.post('/messages/conversations', data),
  
  // Send a message
  sendMessage: (conversationId, data) => 
    api.post(`/messages/conversations/${conversationId}/messages`, data),
  
  // Mark messages as read
  markAsRead: (conversationId) => 
    api.patch(`/messages/conversations/${conversationId}/read`),
  
  // Delete a message
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`)
};

export default api;