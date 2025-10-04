'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Task, User } from '@typeb/types';
import Link from 'next/link';
import { authAdapter } from '@/lib/firebase/auth-adapter';

export default function TasksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status'>('dueDate');

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterAndSortTasks();
  }, [tasks, filter, sortBy]);

  const loadTasks = async () => {
    try {
      const currentUser = await authAdapter.getCurrentUser();
      if (!currentUser) return;
      
      setUser(currentUser);

      if (currentUser.familyId) {
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('familyId', '==', currentUser.familyId),
          orderBy('createdAt', 'desc')
        );
        
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Task));
        
        setTasks(tasksData);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortTasks = () => {
    let filtered = [...tasks];

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(task => task.status === filter);
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - 
                 (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
        case 'status':
          const statusOrder = { pending: 0, in_progress: 1, completed: 2 };
          return (statusOrder[a.status as keyof typeof statusOrder] || 3) - 
                 (statusOrder[b.status as keyof typeof statusOrder] || 3);
        default:
          return 0;
      }
    });

    setFilteredTasks(filtered);
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...(newStatus === 'completed' ? { completedAt: new Date().toISOString() } : {})
      });

      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, updatedAt: new Date() }
          : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getTaskPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Completed</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">In Progress</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Pending</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 section-y">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage your family's tasks and responsibilities</p>
        </div>
        <Link
          href="/dashboard/tasks/new"
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
        >
          + New Task
        </Link>
      </div>

      {/* Filters and Sort */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="dueDate">Due date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
            
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <div className="mb-4 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' 
              ? "Create your first task to get started!"
              : `No ${filter.replace('_', ' ')} tasks at the moment.`}
          </p>
          {filter === 'all' && (
            <Link
              href="/dashboard/tasks/new"
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              Create Task
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`border-2 rounded-xl p-4 hover:shadow-lg transition ${getTaskPriorityColor(task.priority)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex-1">{task.title}</h3>
                {getStatusBadge(task.status)}
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {task.description}
              </p>

              <div className="space-y-2 mb-4">
                {task.assignedTo && (
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Assigned to: {task.assignedTo === user?.id ? 'You' : 'Family member'}
                  </div>
                )}
                
                {task.dueDate && (
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}

                {task.points && (
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {task.points} points
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {task.status !== 'completed' && (
                  <button
                    onClick={() => updateTaskStatus(task.id!, 
                      task.status === 'pending' ? 'in_progress' : 'completed'
                    )}
                    className="flex-1 px-3 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition"
                  >
                    {task.status === 'pending' ? 'Start' : 'Complete'}
                  </button>
                )}
                
                <Link
                  href={`/dashboard/tasks/${task.id}`}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  View
                </Link>
                
                {user?.role === 'parent' && (
                  <button
                    onClick={() => deleteTask(task.id!)}
                    className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}