import React, { useState, useEffect, useRef } from 'react';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from './ui/use-toast';
import { Calendar } from './ui/calendar';
import { 
  AlertCircle, 
  Calendar as CalendarIcon, 
  Clock, 
  Tag,
  Trash2,
  X,
  Plus,
  CheckSquare,
  Paperclip,
  UserPlus
} from 'lucide-react';

const TaskModal = ({ isOpen, closeModal, task: currentTask, employees = [] }) => {
  // Use either closeModal or onClose for backward compatibility
  const onClose = closeModal;
  const task = currentTask;
  const { createTask, updateTask, approveTask, deleteTask } = useTask();
  const { user } = useAuth();
  const { toast } = useToast();
  const { success, error } = useNotifications();
  const isAdmin = user?.role === 'admin';
  const isNewTask = !task?._id;

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium',
    status: 'todo',
    tags: [],
    attachments: [],
    checklist: [],
    estimatedHours: '',
    watchers: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const fileInputRef = useRef(null);

  // Update form when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        dueDate: task.dueDate ? new Date(task.dueDate) : '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        tags: task.tags || [],
        attachments: task.attachments || [],
        checklist: task.checklist || [],
        estimatedHours: task.estimatedHours || '',
        watchers: task.watchers || []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
        priority: 'medium',
        status: 'todo',
        tags: [],
        attachments: [],
        checklist: [],
        estimatedHours: '',
        watchers: []
      });
    }
    // Clear validation errors when task changes
    setValidationErrors({});
  }, [task]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle date change
  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dueDate: date
    }));
    setShowDatePicker(false);
    
    // Clear validation error for this field
    if (validationErrors.dueDate) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.dueDate;
        return newErrors;
      });
    }
  };

  // Handle tag management
  const addTag = () => {
    if (!newTag.trim()) return;
    
    if (!formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
    }
    setNewTag('');
  };
  
  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle checklist functions
  const addChecklistItem = () => {
    if (newChecklistItem.trim() === '') return;
    
    setFormData(prev => ({
      ...prev,
      checklist: [
        ...prev.checklist,
        { id: Date.now(), text: newChecklistItem, completed: false }
      ]
    }));
    setNewChecklistItem('');
  };
  
  const toggleChecklistItem = (id) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    }));
  };
  
  const removeChecklistItem = (id) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
  };

  // Handle file attachment
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Convert files to objects with metadata
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random().toString(36).substring(2),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      file
    }));
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const removeAttachment = (id) => {
    setFormData(prev => {
      const updatedAttachments = prev.attachments.filter(att => att.id !== id);
      // Revoke the object URL to prevent memory leaks
      const attachmentToRemove = prev.attachments.find(att => att.id === id);
      if (attachmentToRemove && attachmentToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(attachmentToRemove.url);
      }
      return {
        ...prev,
        attachments: updatedAttachments
      };
    });
  };

  // Add watcher
  const addWatcher = (employeeId) => {
    if (!formData.watchers.includes(employeeId)) {
      setFormData(prev => ({
        ...prev,
        watchers: [...prev.watchers, employeeId]
      }));
    }
  };

  // Remove watcher
  const removeWatcher = (employeeId) => {
    setFormData(prev => ({
      ...prev,
      watchers: prev.watchers.filter(id => id !== employeeId)
    }));
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }
    
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }
    
    if (isAdmin && !formData.assignedTo) {
      errors.assignedTo = "Please assign this task to someone";
    }
    
    if (formData.dueDate && !isValid(new Date(formData.dueDate))) {
      errors.dueDate = "Please enter a valid date";
    }
    
    if (formData.estimatedHours && (isNaN(formData.estimatedHours) || +formData.estimatedHours <= 0)) {
      errors.estimatedHours = "Please enter a valid number of hours";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Clean up attachment data for API submission
      const cleanAttachments = formData.attachments.map(({ id, name, size, type, url }) => ({
        id, name, size, type, url
      }));

      const taskData = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
        attachments: cleanAttachments
      };

      let result;
      if (isNewTask) {
        result = await createTask(taskData);
        success("Task created successfully");
      } else {
        result = await updateTask(task._id, taskData);
        success("Task updated successfully");
      }

      if (result.success) {
        onClose();
      } else {
        error(result.error || "Something went wrong");
      }
    } catch (err) {
      console.error('Error submitting task:', err);
      error("An unexpected error occurred. Please try again.");
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
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-2xl bg-white/95 backdrop-blur-md border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {isNewTask ? 'Create New Task' : 'Edit Task'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          {/* Title Field */}
          <div className="grid gap-3">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={!isAdmin && !isNewTask}
              className={`${validationErrors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-violet-500 focus:ring-violet-500'}`}
              placeholder="Enter task title"
            />
            {validationErrors.title && (
              <div className="flex items-center text-xs text-red-500">
                <AlertCircle className="h-3 w-3 mr-1" />
                {validationErrors.title}
              </div>
            )}
          </div>
          
          {/* Description Field */}
          <div className="grid gap-3">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea 
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={!isAdmin && !isNewTask}
              rows={4}
              className={`${validationErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-violet-500 focus:ring-violet-500'}`}
              placeholder="Enter task description"
            />
            {validationErrors.description && (
              <div className="flex items-center text-xs text-red-500">
                <AlertCircle className="h-3 w-3 mr-1" />
                {validationErrors.description}
              </div>
            )}
          </div>
          
          {/* Assignment Field - Admin only */}
          {isAdmin && (
            <div className="grid gap-2">
              <Label htmlFor="assignedTo" className="flex items-center gap-1">
                Assign To <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500">(Required)</span>
              </Label>
              <Select 
                value={formData.assignedTo} 
                onValueChange={(value) => handleSelectChange('assignedTo', value)}
                disabled={!isAdmin}
              >
                <SelectTrigger className={validationErrors.assignedTo ? 'border-red-500' : ''}>
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
              {validationErrors.assignedTo && (
                <div className="flex items-center text-xs text-red-500">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {validationErrors.assignedTo}
                </div>
              )}
            </div>
          )}
          
          {/* Due Date Field with Calendar */}
          <div className="grid gap-2">
            <Label htmlFor="dueDate" className="flex items-center gap-1">
              Due Date
              {formData.dueDate && <span className="ml-2 text-xs text-gray-500">
                ({format(new Date(formData.dueDate), 'PPP')})
              </span>}
            </Label>
            <div className="relative">
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !formData.dueDate ? 'text-gray-400' : 'text-gray-900'
                    }`}
                    disabled={!isAdmin && !isNewTask}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? (
                      format(new Date(formData.dueDate), 'PPP')
                    ) : (
                      <span>Select date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate ? new Date(formData.dueDate) : undefined}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Priority Field */}
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
                <SelectItem value="low">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 bg-blue-100 text-blue-800 border-blue-300">Low</Badge>
                    <span>Low Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 bg-green-100 text-green-800 border-green-300">Medium</Badge>
                    <span>Medium Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 bg-orange-100 text-orange-800 border-orange-300">High</Badge>
                    <span>High Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 bg-red-100 text-red-800 border-red-300">Urgent</Badge>
                    <span>Urgent Priority</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Status Field - Admin only */}
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
                  <SelectItem value="todo">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-gray-100 text-gray-800 border-gray-300">To Do</Badge>
                      <span>To Do</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="inprogress">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-blue-100 text-blue-800 border-blue-300">In Progress</Badge>
                      <span>In Progress</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-green-100 text-green-800 border-green-300">Completed</Badge>
                      <span>Completed</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="approved">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-purple-100 text-purple-800 border-purple-300">Approved</Badge>
                      <span>Approved</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Estimated Hours */}
          <div className="grid gap-2">
            <Label htmlFor="estimatedHours" className="flex items-center gap-1">
              Estimated Hours
              <span className="text-xs text-gray-500">(Optional)</span>
            </Label>
            <Input 
              id="estimatedHours"
              name="estimatedHours"
              type="number"
              min="0.5"
              step="0.5"
              value={formData.estimatedHours}
              onChange={handleChange}
              disabled={!isAdmin && !isNewTask}
              placeholder="Enter estimated hours"
              className={validationErrors.estimatedHours ? 'border-red-500' : ''}
            />
            {validationErrors.estimatedHours && (
              <div className="flex items-center text-xs text-red-500">
                <AlertCircle className="h-3 w-3 mr-1" />
                {validationErrors.estimatedHours}
              </div>
            )}
          </div>
          
          {/* Tags */}
          <div className="grid gap-2">
            <Label className="flex items-center justify-between">
              <div>Tags <span className="text-xs text-gray-500">(Optional)</span></div>
              {(isAdmin || isNewTask) && (
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost" 
                  onClick={addTag}
                  className="h-7 px-2 text-xs"
                  disabled={!newTag.trim()}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              )}
            </Label>
            
            {(isAdmin || isNewTask) && (
              <div className="flex items-center gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  className="text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="flex items-center gap-1 pl-2 pr-1 py-1"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                  {(isAdmin || isNewTask) && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeTag(tag)}
                      className="h-4 w-4 p-0 ml-1 text-gray-400 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </Badge>
              ))}
              {formData.tags.length === 0 && (
                <span className="text-xs text-gray-400 italic">No tags added</span>
              )}
            </div>
          </div>
          
          {/* Checklist */}
          <div className="grid gap-2">
            <Label className="flex items-center justify-between">
              <div>Checklist <span className="text-xs text-gray-500">(Optional)</span></div>
              {(isAdmin || isNewTask) && (
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost" 
                  onClick={addChecklistItem}
                  className="h-7 px-2 text-xs"
                  disabled={!newChecklistItem.trim()}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              )}
            </Label>
            
            {(isAdmin || isNewTask) && (
              <div className="flex items-center gap-2">
                <Input
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Add checklist item"
                  className="text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addChecklistItem();
                    }
                  }}
                />
              </div>
            )}
            
            <div className="space-y-2 mt-2">
              {formData.checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="rounded-sm"
                  />
                  <span className={`text-sm flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}>
                    {item.text}
                  </span>
                  {(isAdmin || isNewTask) && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeChecklistItem(item.id)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              {formData.checklist.length === 0 && (
                <span className="text-xs text-gray-400 italic">No checklist items added</span>
              )}
            </div>
          </div>
          
          {/* File Attachments */}
          <div className="grid gap-2">
            <Label className="flex items-center justify-between">
              <div>Attachments <span className="text-xs text-gray-500">(Optional)</span></div>
              {(isAdmin || isNewTask) && (
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 px-2 text-xs"
                >
                  <Paperclip className="h-3 w-3 mr-1" /> Attach Files
                </Button>
              )}
            </Label>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            
            <div className="space-y-2 mt-2">
              {formData.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-gray-500" />
                    <span className="text-sm truncate max-w-[200px]">{attachment.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(attachment.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  {(isAdmin || isNewTask) && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeAttachment(attachment.id)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              {formData.attachments.length === 0 && (
                <span className="text-xs text-gray-400 italic">No files attached</span>
              )}
            </div>
          </div>
          
          {/* Footer Buttons */}
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
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
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
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isSubmitting || (!isAdmin && !isNewTask && task?.assignedTo !== user?._id)}
                className="bg-violet-600 hover:bg-violet-700 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
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