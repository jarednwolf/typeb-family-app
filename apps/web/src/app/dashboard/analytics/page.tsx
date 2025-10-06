'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Task, User } from '@typeb/types';
import { authAdapter } from '@/lib/firebase/auth-adapter';
import UpsellBanner from '@/components/premium/UpsellBanner';

export default function AnalyticsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, rate: 0 });

  useEffect(() => {
    (async () => {
      const current = await authAdapter.getCurrentUser();
      setUser(current);
      if (!current?.familyId) return;
      const tasksQuery = query(collection(db, 'tasks'), where('familyId', '==', current.familyId));
      const snapshot = await getDocs(tasksQuery);
      const tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
      const completed = tasks.filter(t => t.status === 'completed').length;
      const pending = tasks.filter(t => t.status === 'pending').length;
      const total = tasks.length;
      setStats({ total, completed, pending, rate: total ? Math.round((completed/total)*100) : 0 });
    })();
  }, []);

  return (
    <div className="space-y-6 section-y">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Track your family's progress.</p>
      </div>

      {user && !user.isPremium && (
        <UpsellBanner />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tasks" value={stats.total} color="text-blue-600" bg="bg-blue-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </StatCard>
        <StatCard title="Completed" value={stats.completed} color="text-green-600" bg="bg-green-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </StatCard>
        <StatCard title="Pending" value={stats.pending} color="text-orange-600" bg="bg-orange-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </StatCard>
        <StatCard title="Completion Rate" value={`${stats.rate}%`} color="text-purple-600" bg="bg-purple-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 13l3 3 7-7" /></svg>
        </StatCard>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, bg, children }: { title: string; value: any; color: string; bg: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center ${color}`}>
          {children}
        </div>
      </div>
    </div>
  );
}



