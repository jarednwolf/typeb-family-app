'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Task, User } from '@typeb/types';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import FiltersToolbar from '@/components/ui/FiltersToolbar';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/ToastProvider';
const QuickCreateTaskModal = dynamic(() => import('@/components/tasks/QuickCreateTaskModal'), { ssr: false });
import { authAdapter } from '@/lib/firebase/auth-adapter';

export default function TasksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status'>('dueDate');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickOpen, setQuickOpen] = useState(false);
  const [editingDueFor, setEditingDueFor] = useState<string | null>(null);
  const { show } = useToast();

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterAndSortTasks();
  }, [tasks, filter, sortBy, searchQuery]);

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

    // Apply text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => (t.title || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
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
      show(newStatus === 'completed' ? 'Task completed' : 'Task updated', 'success');
    } catch (error) {
      console.error('Error updating task:', error);
      show('Failed to update task', 'error');
    }
  };

  const cycleStatus = (status: Task['status']): Task['status'] => {
    if (status === 'pending') return 'in_progress';
    if (status === 'in_progress') return 'completed';
    return 'pending';
  };

  const updateTaskDueDate = async (taskId: string, newDate: string) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        dueDate: new Date(newDate),
        updatedAt: new Date().toISOString(),
      });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, dueDate: new Date(newDate) as any } : t));
      show('Due date updated', 'success');
    } catch (error) {
      console.error('Error updating due date:', error);
      show('Failed to update due date', 'error');
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

  const getStatusBadge = (status: string, onClick?: () => void) => {
    switch (status) {
      case 'completed':
        return <button onClick={onClick} className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 hover:brightness-95" title="Toggle status">Completed</button>;
      case 'in_progress':
        return <button onClick={onClick} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 hover:brightness-95" title="Toggle status">In Progress</button>;
      case 'pending':
        return <button onClick={onClick} className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 hover:brightness-95" title="Toggle status">Pending</button>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 section-y">
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-2 rounded-xl p-4">
              <Skeleton className="h-4 w-40 mb-3" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-5/6" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 section-y">
      <PageHeader
        title="Tasks"
        subtitle="Manage your family's tasks and responsibilities"
        primaryAction={{ href: '/dashboard/tasks/new', label: '+ New Task', analyticsId: 'cta_new_task_header' }}
        right={<button onClick={()=>{ setQuickOpen(true); show('Quick create opened'); }} className="btn btn-secondary px-3 hidden sm:inline-flex">Quick create</button>}
      />

      <FiltersToolbar
        status={filter}
        onStatusChange={(v)=>setFilter(v as typeof filter)}
        sortBy={sortBy}
        onSortByChange={(v)=>setSortBy(v as typeof sortBy)}
        query={searchQuery}
        onQueryChange={(v)=>setSearchQuery(v)}
        onReset={()=>{ setFilter('all'); setSortBy('dueDate'); setSearchQuery(''); }}
        right={
          <div className="flex gap-2">
            <button onClick={()=>setQuickOpen(true)} className="btn btn-secondary px-3 sm:hidden" aria-label="Quick create task">Quick</button>
            <Link href="/dashboard/tasks/new" className="btn btn-primary px-4 transition sm:hidden" aria-label="Create new task">+ New Task</Link>
          </div>
        }
      />

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description={filter === 'all' ? 'Create your first task to get started!' : `No ${filter.replace('_', ' ')} tasks at the moment.`}
          cta={filter === 'all' ? { href: '/dashboard/tasks/new', label: 'Create Task' } : undefined}
          helpHref="/help"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`border-2 rounded-xl p-4 hover:shadow-lg transition ${getTaskPriorityColor(task.priority)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex-1">{task.title}</h3>
                {getStatusBadge(task.status, () => updateTaskStatus(task.id!, cycleStatus(task.status)))}
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
                
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="mr-2">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</span>
                  <button
                    onClick={() => setEditingDueFor(editingDueFor === task.id ? null : task.id || null)}
                    className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    aria-label="Change due date"
                  >
                    Change
                  </button>
                </div>
                {editingDueFor === task.id && (
                  <div className="mt-2">
                    <input
                      type="date"
                      defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                      onChange={(e)=>{ updateTaskDueDate(task.id!, e.target.value); setEditingDueFor(null); }}
                      className="px-2 py-1 text-sm border border-gray-300 rounded"
                    />
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
                {task.requiresPhoto && (
                  <button
                    onClick={async () => {
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.accept = 'image/*';
                      fileInput.onchange = async () => {
                        const file = fileInput.files?.[0];
                        if (!file) return;
                        try {
                          const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
                          const { default: app } = await import('@/lib/firebase/config');
                          const storage = getStorage(app);
                          const r = ref(storage, `task-submissions/${task.id}/${Date.now()}`);
                          await uploadBytes(r, file);
                          const url = await getDownloadURL(r);
                          await setDoc(doc(db, 'task_submissions', `${task.id}`), {
                            taskId: task.id,
                            submittedAt: new Date().toISOString(),
                            status: 'pending',
                            photoUrl: url,
                          });
                          alert('Photo submitted for validation');
                        } catch {
                          alert('Upload failed');
                        } finally {
                          document.body.removeChild(fileInput);
                        }
                      };
                      document.body.appendChild(fileInput);
                      fileInput.click();
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Upload Photo
                  </button>
                )}
                
                <Link
                  href={`/dashboard/tasks/${task.id}`}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  aria-label={`Edit task ${task.title}`}
                >
                  Edit
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
      <QuickCreateTaskModal open={quickOpen} onClose={()=>setQuickOpen(false)} onCreated={()=>loadTasks()} />
    </div>
  );
}