import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaBuilding, 
  FaPhone, 
  FaGoogle, 
  FaFacebookF, 
  FaCaretDown
} from 'react-icons/fa';
import { organizationService } from '../services/api';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationId: '',
    mobile: ''
  });
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  // Redirect if already logged in and fetch organizations
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    
    // Fetch available organizations
    const fetchOrganizations = async () => {
      setOrganizationsLoading(true);
      try {
        const response = await organizationService.getAvailableOrganizations();
        if (response.data && response.data.status === 'success') {
          setOrganizations(response.data.data.organizations || []);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load organizations',
          variant: 'destructive',
        });
      } finally {
        setOrganizationsLoading(false);
      }
    };
    
    fetchOrganizations();
  }, [isAuthenticated, navigate, toast]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);

    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        organizationId: formData.organizationId,
        mobile: formData.mobile
      });
      
      if (result.success) {
        toast({
          title: 'Registration Successful',
          description: 'Your account is pending approval by an administrator',
        });
        navigate('/login');
      } else {
        toast({
          title: 'Registration Failed',
          description: result.message || 'Failed to create account',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-10">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Join Work-Flow</h1>
          <p className="mt-2 text-sm text-gray-400">Register as an employee to get started</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-400">
                  First Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="pl-10 block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                    placeholder="John"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-400">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-400">
                Username
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="pl-10 block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  placeholder="johndoe"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400">
                Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-gray-400">
                Mobile Number
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="pl-10 block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  placeholder="+1234567890"
                />
              </div>
            </div>
              <div>
              <label htmlFor="organizationId" className="block text-sm font-medium text-gray-400">
                Organization
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBuilding className="h-4 w-4 text-gray-500" />
                </div>
                {organizationsLoading ? (
                  <div className="pl-10 block w-full px-3 py-2 border border-gray-700 text-gray-400 bg-gray-700 rounded-md">
                    Loading organizations...
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      id="organizationId"
                      name="organizationId"
                      required
                      value={formData.organizationId}
                      onChange={handleChange}
                      className="pl-10 block w-full px-3 py-2 border border-gray-700 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-violet-500 focus:border-violet-500 appearance-none"
                    >
                      <option value="" disabled>Select an organization</option>
                      {organizations.map(org => (
                        <option key={org._id} value={org.organization_id_slug}>
                          {org.name} ({org.organization_id_slug})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <FaCaretDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Select the organization you belong to
              </p>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  placeholder="********"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                  placeholder="********"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/login" className="font-medium text-violet-400 hover:text-violet-300">
                Already have an account?
              </Link>
            </div>
          </div>          <div>
            <Button
              type="submit"
              className="group relative w-full py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </div>
        </form>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button
            type="button"
            className="w-full py-2 px-4 flex justify-center items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 rounded-md transition-all"
            onClick={() => toast({
              title: "Google Sign-Up",
              description: "Google sign-up integration will be available soon!",
            })}
          >
            <FaGoogle className="h-5 w-5 text-red-500" />
            <span>Google</span>
          </button>
          
          <button
            type="button"
            className="w-full py-2 px-4 flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all"
            onClick={() => toast({
              title: "Facebook Sign-Up",
              description: "Facebook sign-up integration will be available soon!",
            })}
          >
            <FaFacebookF className="h-5 w-5" />
            <span>Facebook</span>
          </button>
        </div>
        
        <div className="text-center text-sm mt-6">
          <Link to="/" className="font-medium text-violet-400 hover:text-violet-300">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;