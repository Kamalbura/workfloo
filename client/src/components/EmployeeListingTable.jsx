import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { employeeService } from '../services/api';
import { toast } from './ui/use-toast';
import { FaCheck, FaTimes, FaTrash, FaEdit, FaUserCheck } from 'react-icons/fa';

const EmployeeListingTable = ({ filter = 'all' }) => {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Load employees based on filter
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        
        // Determine query params based on filter
        const params = {
          organizationId: user.organizationId
        };
        
        if (filter === 'pending') {
          params.status = 'pending';
        } else if (filter === 'approved') {
          params.status = 'approved';
        }
        
        const response = await employeeService.getAllEmployees(params);
        
        if (response.data && response.data.success) {
          setEmployees(response.data.data);
        } else {
          setEmployees([]);
        }
      } catch (err) {
        console.error('Error loading employees:', err);
        setError(err.response?.data?.message || 'Failed to load employees');
        toast({
          title: "Error",
          description: "Failed to load employee data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (user && user.role === 'admin') {
      loadEmployees();
    }
  }, [user, filter, refreshTrigger]);
  
  // Handle approve employee action
  const handleApproveEmployee = async (employeeId) => {
    try {
      await employeeService.approveEmployee(employeeId);
      
      toast({
        title: "Success",
        description: "Employee approved successfully"
      });
      
      // Refresh the list
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error approving employee:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to approve employee",
        variant: "destructive"
      });
    }
  };
  
  // Handle delete employee action
  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }
    
    try {
      await employeeService.deleteEmployee(employeeId);
      
      toast({
        title: "Success",
        description: "Employee deleted successfully"
      });
      
      // Refresh the list
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error deleting employee:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete employee",
        variant: "destructive"
      });
    }
  };
  
  // Show loading spinner
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Handle no employees case
  if (employees.length === 0) {
    return (
      <div className="bg-gray-50 p-8 text-center rounded-lg">
        <p className="text-gray-500">
          {filter === 'pending' ? 'No pending employees found.' :
           filter === 'approved' ? 'No approved employees found.' :
           'No employees found.'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employee
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employee ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {employees.map(employee => (
            <tr key={employee._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {employee.employeeId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {employee.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {employee.status === 'approved' ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Approved
                  </span>
                ) : employee.status === 'pending' ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {employee.status}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  {employee.status === 'pending' && (
                    <button
                      onClick={() => handleApproveEmployee(employee._id)}
                      className="text-green-600 hover:text-green-900 flex items-center"
                      title="Approve"
                    >
                      <FaUserCheck className="mr-1" /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteEmployee(employee._id)}
                    className="text-red-600 hover:text-red-900 flex items-center"
                    title="Delete"
                  >
                    <FaTrash className="mr-1" /> Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeListingTable;
