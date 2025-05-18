import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/use-toast';

// Create context
export const AuthContext = createContext(null);

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for existing token and fetch user profile on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch user profile
        const response = await authService.getUserProfile();
        
        if (response.data && response.data.success) {
          setUser(response.data.data);
          setIsAuthenticated(true);
        } else {
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      
      if (response.data && response.data.success) {
        // Save token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Update state
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        // Show success message
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${response.data.user.firstName}!`
        });
        
        // Redirect based on role
        const dashboardPath = response.data.user.role === 'admin' 
          ? '/admin/dashboard' 
          : '/employee/dashboard';
        
        navigate(dashboardPath);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          message: response.data?.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'An error occurred during login'
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      
      if (response.data && response.data.success) {
        return { 
          success: true, 
          message: 'Registration successful. Awaiting approval.'
        };
      } else {
        return { 
          success: false, 
          message: response.data?.message || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'An error occurred during registration'
      };
    }
  };

  // Logout function
  const logout = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Update state
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirect to login
    navigate('/login');
    
    // Show message
    toast({
      title: 'Logged Out',
      description: 'You have been logged out successfully'
    });
  };

  // Provider value
  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;