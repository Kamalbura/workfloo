import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { FaArrowRight, FaCheck, FaColumns, FaUsers } from 'react-icons/fa';

const HomePage = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero section */}
      <header className="relative">
        <div className="bg-gradient-to-r from-purple-900 to-indigo-800 pt-16 pb-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
                Streamline Your Team's<br className="hidden md:block" /> Workflow Efficiently
              </h1>
              <p className="text-xl text-purple-100 max-w-2xl mx-auto md:mx-0 mb-10">
                Work-Flow helps teams collaborate better with task management and seamless approval workflows all in one place.
              </p>
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-center md:justify-start">
                <Link to="/register">
                  <Button className="bg-white text-purple-900 hover:bg-purple-50 px-8 py-3 text-lg w-full md:w-auto">
                    Get Started <FaArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg w-full md:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave effect */}
        <div className="absolute bottom-0 w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="text-gray-900 w-full">
            <path fill="currentColor" fillOpacity="1" d="M0,192L48,186.7C96,181,192,171,288,181.3C384,192,480,224,576,234.7C672,245,768,235,864,208C960,181,1056,139,1152,133.3C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </header>
      
      {/* Features section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-purple-700/30 rounded-lg flex items-center justify-center mb-6">
                <FaColumns className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Kanban Task Management</h3>
              <p className="text-gray-400 leading-relaxed">
                Visualize workflow with intuitive drag-and-drop Kanban boards that keep everyone on the same page.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-indigo-700/30 rounded-lg flex items-center justify-center mb-6">
                <FaUsers className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Role-Based Access</h3>
              <p className="text-gray-400 leading-relaxed">
                Control permissions with admin and employee roles to ensure the right people have access to the right information.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-8 shadow-lg">
              <div className="w-14 h-14 bg-blue-700/30 rounded-lg flex items-center justify-center mb-6">
                <FaCheck className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Approval Workflows</h3>
              <p className="text-gray-400 leading-relaxed">
                Streamline approval processes for new employees and completed tasks with dedicated admin controls.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA section */}
      <section className="bg-gradient-to-b from-gray-900 to-purple-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to improve your team's productivity?</h2>
          <p className="text-xl text-purple-100 mb-10">
            Join thousands of teams that have transformed their workflow with our platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/register">
              <Button className="bg-white text-purple-900 hover:bg-purple-50 px-8 py-3 text-lg w-full">
                Sign Up for Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} Work-Flow. All rights reserved.</p>
            <p className="mt-2 text-sm">A project management and workflow solution.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;