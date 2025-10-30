'use client';

import { useState, useEffect } from 'react';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Task, User } from '@typeb/types';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist';
import PageHeader from '@/components/ui/PageHeader';
import { authAdapter } from '@/lib/firebase/auth-adapter';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await authAdapter.getCurrentUser();
      if (!currentUser) return;
      
      setUser(currentUser);

      // Load tasks
      if (currentUser.familyId) {
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('familyId', '==', currentUser.familyId),
          orderBy('dueDate', 'desc'),
          limit(10)
        );
        
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Task));
        
        setTasks(tasksData);

        // Calculate stats
        const completed = tasksData.filter(t => t.status === 'completed').length;
        const pending = tasksData.filter(t => t.status === 'pending').length;
        const total = tasksData.length;
        
        setStats({
          totalTasks: total,
          completedTasks: completed,
          pendingTasks: pending,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTaskPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'pending': return '⏰';
      default: return '📝';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 section-y">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="h-6 w-64 bg-gray-200 animate-pulse rounded" />
          <div className="h-4 w-80 bg-gray-200 animate-pulse rounded mt-3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="h-5 w-40 bg-gray-200 animate-pulse rounded" />
          <div className="h-4 w-full bg-gray-200 animate-pulse rounded mt-4" />
          <div className="h-4 w-full bg-gray-200 animate-pulse rounded mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 section-y">
      <PageHeader
        title={`Welcome back, ${user?.displayName || 'User'}!`}
        subtitle="Here's what's happening with your family tasks today."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalTasks}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-100 text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.completedTasks}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-100 text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {stats.pendingTasks}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-100 text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {stats.completionRate}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-100 text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V9a2 2 0 012-2h2a2 2 0 012 2v10M5 19v-4a2 2 0 012-2h0a2 2 0 012 2v4m8 0v-7a2 2 0 012-2h0a2 2 0 012 2v7" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding checklist when empty */}
      {tasks.length === 0 && (
        <OnboardingChecklist familyHasMembers={!!user?.familyId} />
      )}

      {/* Recent Tasks */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Tasks</h2>
            <Link
              href="/dashboard/tasks"
              className="text-sm text-black hover:underline"
            >
              View all →
            </Link>
          </div>
        </div>
        
        <div className="divide-y">
          {tasks.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No tasks yet. Create your first task to get started!
            </div>
          ) : (
            tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="mt-1 text-gray-700">
                      {task.status === 'completed' && (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      )}
                      {task.status === 'in_progress' && (
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 108 8" /></svg>
                      )}
                      {task.status === 'pending' && (
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                      {!['completed','in_progress','pending'].includes(task.status as any) && (
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" /></svg>
                      )}
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getTaskPriorityColor(task.priority)}`}>
                          {task.priority || 'normal'}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-gray-500" title={new Date(task.dueDate).toLocaleString()}>
                            Due: {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                        {task.points && (
                          <span className="text-xs text-gray-500">
                            {task.points} points
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/tasks/${task.id}`}
                    className="text-sm text-black hover:underline"
                    aria-label={`View task ${task.title}`}
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions already present */}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/tasks/new" className="bg-white rounded-xl p-6 hover:bg-gray-50 transition shadow-sm">
          <div className="flex items-center space-x-3">
            <Icon name="task" className="w-6 h-6 text-gray-800" />
            <div>
              <h3 className="font-semibold">Create Task</h3>
              <p className="text-sm text-gray-600">Add a new task for your family</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/family" className="bg-white rounded-xl p-6 hover:bg-gray-50 transition shadow-sm">
          <div className="flex items-center space-x-3">
            <Icon name="users" className="w-6 h-6 text-gray-800" />
            <div>
              <h3 className="font-semibold">Manage Family</h3>
              <p className="text-sm text-gray-600">View and invite members</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/analytics" className="bg-white rounded-xl p-6 hover:bg-gray-50 transition shadow-sm">
          <div className="flex items-center space-x-3">
            <Icon name="chart" className="w-6 h-6 text-gray-800" />
            <div>
              <h3 className="font-semibold">View Analytics</h3>
              <p className="text-sm text-gray-600">Track family progress</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}