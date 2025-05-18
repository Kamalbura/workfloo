import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Protected Route Component
 * 
 * Wraps routes that should only be accessible to authenticated users
 * with specific roles.
 * 
 * @param {Object} props
 * @param {Array} props.allowedRoles - Array of roles that can access this route
 * @param {JSX.Element} props.children - Child components to render if authenticated
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }
  
  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // No role restrictions, or user has an allowed role
  if (!allowedRoles || allowedRoles.length === 0 || allowedRoles.includes(user?.role)) {
    return children;
  }
  
  // User doesn't have the required role - redirect to appropriate dashboard
  const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
  return <Navigate to={dashboardPath} replace />;
};

export default ProtectedRoute;