import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminTeamPage from './pages/AdminTeamPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminTasksPage from './pages/AdminTasksPage';
import AdminCalendarPage from './pages/AdminCalendarPage';
import AdminMessagesPage from './pages/AdminMessagesPage';
import EmployeeDashboardPage from './pages/EmployeeDashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { MessageProvider } from './contexts/MessageContext';

const App = () => {  return (
    <>
      <AuthProvider>
        <TaskProvider>
          <NotificationProvider>
            <MessageProvider>
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
              <Route 
                path="/admin/team" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminTeamPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/analytics" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminAnalyticsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/reports" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminReportsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/settings" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminSettingsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/tasks" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminTasksPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/calendar" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminCalendarPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/messages" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminMessagesPage />
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
              />                {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </MessageProvider>
          </NotificationProvider>
        </TaskProvider>
      </AuthProvider>
      <Toaster />
    </>
  );
};

export default App;