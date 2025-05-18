import React, { useState, useEffect } from 'react';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { format } from 'date-fns';
import { useToast } from './ui/use-toast';

const TaskModal = ({ isOpen, closeModal, task: currentTask, employees = [] }) => {
  // Use either closeModal or onClose for backward compatibility
  const onClose = closeModal;
  const task = currentTask;
  const { createTask, updateTask, approveTask, deleteTask } = useTask();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';
  const isNewTask = !task?._id;
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium',
    status: 'todo'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedTo: task.assignedTo || '',
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        priority: task.priority || 'medium',
        status: task.status || 'todo'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
        priority: 'medium',
        status: 'todo'
      });
    }
  }, [task]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.title || !formData.description || (!isAdmin && !formData.assignedTo)) {
        toast({
          title: "Validation Error",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }

      const taskData = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
      };

      let result;
      if (isNewTask) {
        result = await createTask(taskData);
      } else {
        result = await updateTask(task._id, taskData);
      }

      if (result.success) {
        toast({
          title: isNewTask ? "Task Created" : "Task Updated",
          description: isNewTask ? "Task has been created successfully" : "Task has been updated successfully"
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description: result.error || "Something went wrong",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  // Handle task approval
  const handleApprove = async () => {
    if (!isAdmin || !task?._id) return;
    
    // Only allow approving completed tasks
    if (task.status !== 'completed') {
      toast({
        title: "Cannot Approve",
        description: "Only tasks marked as 'Completed' can be approved",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await approveTask(task._id);
      
      if (result.success) {
        toast({
          title: "Task Approved",
          description: "The task has been approved successfully"
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to approve task",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error approving task:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle task deletion
  const handleDelete = async () => {
    if (!isAdmin || !task?._id) return;
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      setIsSubmitting(true);
      try {
        const result = await deleteTask(task._id);
        
        if (result.success) {
          toast({
            title: "Task Deleted",
            description: "The task has been deleted successfully"
          });
          onClose();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to delete task",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error deleting task:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg bg-white/95 backdrop-blur-md border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {isNewTask ? 'Create New Task' : 'Edit Task'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-3">
            <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
            <Input 
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={!isAdmin && !isNewTask}
              required
              className="border-gray-300 focus:border-violet-500 focus:ring-violet-500"
              placeholder="Enter task title"
            />
          </div>
          
          <div className="grid gap-3">
            <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
            <Textarea 
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={!isAdmin && !isNewTask}
              rows={4}
              required
              className="border-gray-300 focus:border-violet-500 focus:ring-violet-500"
              placeholder="Enter task description"
            />
          </div>
          
          {isAdmin && (
            <div className="grid gap-2">
              <Label htmlFor="assignedTo">Assign To</Label>
              <Select 
                value={formData.assignedTo} 
                onValueChange={(value) => handleSelectChange('assignedTo', value)}
                disabled={!isAdmin}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {`${employee.firstName} ${employee.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input 
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              disabled={!isAdmin && !isNewTask}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => handleSelectChange('priority', value)}
              disabled={!isAdmin && !isNewTask}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isAdmin && !isNewTask && (
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="inprogress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-4 border-t mt-6">
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={isSubmitting}
                className="border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              {isAdmin && !isNewTask && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete} 
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Delete
                  </span>
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              {isAdmin && !isNewTask && task?.status === 'completed' && (
                <Button 
                  type="button" 
                  onClick={handleApprove} 
                  variant="secondary"
                  disabled={isSubmitting}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Approve
                  </span>
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isSubmitting || (!isAdmin && !isNewTask && task?.assignedTo !== user?._id)}
                className="bg-violet-600 hover:bg-violet-700 transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : isNewTask ? 'Create Task' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;