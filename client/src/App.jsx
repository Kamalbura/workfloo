import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import EmployeeDashboardPage from './pages/EmployeeDashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';

const App = () => {  return (
    <>
      <AuthProvider>
        <TaskProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Admin routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Employee routes */}
            <Route 
              path="/employee/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <EmployeeDashboardPage />
                </ProtectedRoute>
              } 
            />
              {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </TaskProvider>
      </AuthProvider>      <Toaster />
    </>
  );
};

export default App;