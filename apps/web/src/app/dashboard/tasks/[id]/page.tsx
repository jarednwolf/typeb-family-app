'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Task } from '@typeb/types';

export default function EditTaskPage() {
  const router = useRouter();
  // @ts-ignore next/navigation useParams
  const params = useParams();
  const taskId = params?.id as string;
  const [task, setTask] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as Task['priority'] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!taskId) return;
      const snap = await getDoc(doc(db, 'tasks', taskId));
      if (snap.exists()) {
        const t = { id: snap.id, ...snap.data() } as Task;
        setTask(t);
        setForm({ title: t.title, description: t.description || '', priority: t.priority });
      }
    })();
  }, [taskId]);

  const save = async () => {
    if (!task) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'tasks', task.id), { ...form, updatedAt: new Date() as any });
      router.push('/dashboard/tasks');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!task) return;
    if (!confirm('Delete this task?')) return;
    await deleteDoc(doc(db, 'tasks', task.id));
    router.push('/dashboard/tasks');
  };

  if (!task) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto section-y">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={form.title} onChange={(e)=>setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e)=>setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select value={form.priority} onChange={(e)=>setForm({ ...form, priority: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={remove} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">Delete</button>
            <button onClick={()=>router.back()} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}


