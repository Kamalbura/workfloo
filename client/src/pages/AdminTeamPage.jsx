import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { 
  Check, 
  X, 
  Users, 
  UserPlus, 
  Search,
  Mail,
  MoreHorizontal,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { employeeService } from '../services/api';

const AdminTeamPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [employees, setEmployees] = useState([]);
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [viewMode, setViewMode] = useState('active'); // active, pending, all

  const toggleSidebar = () => {
    setIsSidebarVisible(prevState => !prevState);
  };

  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
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
        setLoading(false);
      }
    };
    
    fetchEmployees();
  }, [toast]);

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

  // Function to invite a new employee
  const inviteEmployee = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Replace with actual API call when implemented
      // const response = await employeeService.inviteEmployee(inviteEmail);
      
      toast({
        title: 'Invitation Sent',
        description: `Invitation email has been sent to ${inviteEmail}`,
      });
      
      setInviteEmail('');
      setIsInviteModalOpen(false);
    } catch (error) {
      console.error('Error inviting employee:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  };

  // Toggle employee selection
  const toggleEmployeeSelection = (empId) => {
    if (selectedEmployees.includes(empId)) {
      setSelectedEmployees(prev => prev.filter(id => id !== empId));
    } else {
      setSelectedEmployees(prev => [...prev, empId]);
    }
  };

  // Filter employees based on search query
  const filteredEmployees = employees.filter(emp => 
    emp.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPendingEmployees = pendingEmployees.filter(emp => 
    emp.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Determine which employees to display based on view mode
  const displayEmployees = viewMode === 'active' ? filteredEmployees : 
                          viewMode === 'pending' ? filteredPendingEmployees :
                          [...filteredEmployees, ...filteredPendingEmployees];

  // Invite Modal Component
  const InviteModal = () => (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        <div className="relative mb-4">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/10 rounded-full blur-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg mr-3">
                  <UserPlus className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invite Team Member</h2>
              </div>
              
              <button 
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                onClick={() => setIsInviteModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Send an invitation email to add a new team member</p>
          </div>
        </div>

        <form onSubmit={inviteEmployee} className="space-y-4">
          <div>
            <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="pl-10 pr-4 py-2 w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-600"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setIsInviteModalOpen(false)}
              className="bg-transparent border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'} fixed lg:relative w-64 z-10 transition-transform duration-300 ease-in-out lg:translate-x-0 h-screen`}>
        <AdminSidebar activePage="team" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader 
          title="Team Management" 
          toggleSidebar={toggleSidebar} 
          isSidebarVisible={isSidebarVisible} 
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
          {/* Header with actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Team Management</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {viewMode === 'active' ? 'Manage your active team members' :
                   viewMode === 'pending' ? 'Review pending team member approvals' :
                   'Manage all team members and approvals'}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <Button 
                  variant="outline" 
                  className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button 
                  onClick={() => setIsInviteModalOpen(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Invite Team Member
                </Button>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => setViewMode('active')} 
                    className={`px-4 py-2 text-sm ${viewMode === 'active' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                  >
                    Active
                  </button>
                  <button 
                    onClick={() => setViewMode('pending')} 
                    className={`px-4 py-2 text-sm ${viewMode === 'pending' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                  >
                    Pending ({pendingEmployees.length})
                  </button>
                  <button 
                    onClick={() => setViewMode('all')} 
                    className={`px-4 py-2 text-sm ${viewMode === 'all' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                  >
                    All
                  </button>
                </div>
                
                <Button variant="outline" size="icon" className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Team members list */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          className="rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500"
                          onChange={() => {
                            if (selectedEmployees.length === displayEmployees.length) {
                              setSelectedEmployees([]);
                            } else {
                              setSelectedEmployees(displayEmployees.map(emp => emp._id));
                            }
                          }}
                          checked={selectedEmployees.length === displayEmployees.length && displayEmployees.length > 0}
                        />
                        <span>Name</span>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {displayEmployees.length > 0 ? (
                    displayEmployees.map(emp => (
                      <tr key={emp._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <input 
                              type="checkbox"
                              className="rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500"
                              onChange={() => toggleEmployeeSelection(emp._id)}
                              checked={selectedEmployees.includes(emp._id)}
                            />
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                              {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</div>
                              {emp.role && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">{emp.role}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {emp.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {emp.employeeId ? (
                            <div className="text-sm text-gray-900 dark:text-gray-300">{emp.employeeId}</div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {emp.status === 'active' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : 'Not joined'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {!emp.employeeId ? (
                            <Button 
                              size="sm" 
                              onClick={() => approveEmployee(emp._id)}
                              className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm"
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                          ) : (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center">
                          {searchQuery ? (
                            <>
                              <Search className="h-10 w-10 text-gray-400 mb-2" />
                              <p className="text-lg">No team members match your search</p>
                            </>
                          ) : (
                            <>
                              <Users className="h-10 w-10 text-gray-400 mb-2" />
                              <p className="text-lg">No team members {viewMode === 'pending' ? 'pending approval' : ''}</p>
                            </>
                          )}
                          <Button 
                            onClick={() => setIsInviteModalOpen(true)}
                            className="bg-violet-600 hover:bg-violet-700 text-white mt-4"
                          >
                            <UserPlus className="h-5 w-5 mr-2" /> Invite Team Member
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Modals */}
        {isInviteModalOpen && <InviteModal />}
      </div>
    </div>
  );
};

export default AdminTeamPage;
