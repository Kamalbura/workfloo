import React, { useState } from 'react';
import { useTask } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Check, AlertCircle } from 'lucide-react';

const KanbanBoard = ({ onTaskClick }) => {
  const { tasks, updateTaskStatus, approveTask } = useTask();
  const { user } = useAuth();
  const { toast } = useToast();
    // Define the columns for our Kanban board
  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-blue-100 text-blue-800' },
    { id: 'inprogress', title: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'completed', title: 'Completed', color: 'bg-green-100 text-green-800' }
  ];
  
  // Add "Overdue" column for all users
  columns.push({
    id: 'overdue',
    title: 'Overdue',
    color: 'bg-red-100 text-red-800'
  });
  
  // If user is admin, add an "Approved" column
  if (user?.role === 'admin') {
    columns.push({ 
      id: 'approved', 
      title: 'Approved', 
      color: 'bg-purple-100 text-purple-800' 
    });
  }
  // Handle drag end event
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    
    // Dropped outside the list
    if (!destination) return;
    
    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    
    // Update task status in backend
    try {
      // Check if user is authorized to make this status change
      if (user.role !== 'admin' && destination.droppableId === 'approved') {
        toast({
          title: "Permission Denied",
          description: "Only administrators can approve tasks.",
          variant: "destructive"
        });
        return; // Only admins can approve tasks
      }

      // Prevent dragging from approved (if not admin)
      if (user.role !== 'admin' && source.droppableId === 'approved') {
        toast({
          title: "Permission Denied",
          description: "Approved tasks cannot be moved.",
          variant: "destructive"
        });
        return;
      }

      // Prevent dragging from overdue to anything except inprogress/completed
      if (source.droppableId === 'overdue' && 
          destination.droppableId !== 'inprogress' && 
          destination.droppableId !== 'completed') {
        toast({
          title: "Invalid Action",
          description: "Overdue tasks must first be marked as in progress or completed.",
          variant: "destructive"
        });
        return;
      }

      // Get the task details
      const task = tasks.find(t => t._id === draggableId);
      
      // Prevent employees from moving other's tasks
      if (user.role !== 'admin' && task.assignedTo !== user._id) {
        toast({
          title: "Permission Denied",
          description: "You can only move tasks assigned to you.",
          variant: "destructive"
        });
        return; // Employees can only move their own tasks
      }

      // Special case for approving tasks
      if (destination.droppableId === 'approved' && user.role === 'admin') {
        await approveTask(draggableId);
        toast({
          title: "Task Approved",
          description: "The task has been approved successfully."
        });
      } else {
        // Regular status update
        await updateTaskStatus(draggableId, destination.droppableId);
        toast({
          title: "Task Updated",
          description: `Task moved to ${destination.droppableId.charAt(0).toUpperCase() + destination.droppableId.slice(1)}.`
        });
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter tasks by status
  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  // Format due date
  const formatDueDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Check if task is overdue
  const isOverdue = (task) => {
    if (!task.dueDate) return false;
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate < now && task.status !== 'completed' && task.status !== 'approved';
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>      <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-6">
        {columns.map((column) => (
          <Card key={column.id} className="h-full shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-b from-white to-gray-50">
            <CardHeader className={`${column.color} rounded-t-lg`}>
              <CardTitle className="text-lg font-bold flex items-center justify-between">
                <div className="flex items-center">
                  {column.id === 'todo' && <Clock className="mr-2 h-5 w-5 text-blue-700" />}
                  {column.id === 'inprogress' && <div className="mr-2 h-5 w-5 text-yellow-700 flex items-center justify-center">🔄</div>}
                  {column.id === 'completed' && <Check className="mr-2 h-5 w-5 text-green-700" />}
                  {column.id === 'approved' && <div className="mr-2 h-5 w-5 text-purple-700 flex items-center justify-center">✓</div>}
                  {column.id === 'overdue' && <AlertCircle className="mr-2 h-5 w-5 text-red-700" />}
                  {column.title}
                </div>
                <Badge variant="outline" className="font-medium bg-white">{getTasksByStatus(column.id).length}</Badge>
              </CardTitle>
            </CardHeader>
            <Droppable droppableId={column.id}>
              {(provided) => (
                <CardContent 
                  className="pt-4 min-h-[250px] max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {getTasksByStatus(column.id).map((task, index) => (
                    <Draggable 
                      key={task._id} 
                      draggableId={task._id} 
                      index={index}
                      isDragDisabled={user.role !== 'admin' && task.assignedTo !== user._id}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-4"
                        >                          <Card 
                            className={`cursor-pointer border-l-4 shadow-sm hover:shadow-md transition-all duration-200 
                              ${isOverdue(task) ? 'border-l-red-500' : 
                                task.priority === 'high' ? 'border-l-red-500' :
                                task.priority === 'medium' ? 'border-l-yellow-500' :
                                'border-l-blue-500'} 
                              ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/50 scale-105' : ''}
                              animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            onClick={() => onTaskClick(task)}
                          >
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-base mb-2">{task.title}</h3>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description}</p>
                              
                              <div className="flex flex-wrap justify-between items-center text-xs text-gray-500 mt-3 pt-2 border-t">
                                {task.dueDate && (
                                  <div className={`flex items-center ${isOverdue(task) ? 'text-red-500 font-medium' : ''}`}>
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDueDate(task.dueDate)}
                                  </div>
                                )}

                                {task.priority && (
                                  <Badge 
                                    className={
                                      task.priority === 'high' ? 'bg-red-100 text-red-800 font-medium' :
                                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 font-medium' :
                                      'bg-blue-100 text-blue-800 font-medium'
                                    }
                                  >
                                    {task.priority}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </CardContent>
              )}
            </Droppable>
          </Card>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;