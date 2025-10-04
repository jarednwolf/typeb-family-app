'use client';

import { useEffect, useState } from 'react';
import { authAdapter } from '@/lib/firebase/auth-adapter';
import { auth, db } from '@/lib/firebase/config';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { User } from '@typeb/types';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const current = await authAdapter.getCurrentUser();
      if (current) {
        setUser(current);
        setNotifications(!!current.notificationsEnabled);
        setName(current.displayName || '');
      }
    })();
  }, []);

  const saveProfile = async () => {
    if (!auth.currentUser || !user) return;
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      await updateDoc(doc(db, 'users', user.id), { displayName: name });
      setUser({ ...user, displayName: name });
      alert('Profile updated');
    } catch (e) {
      console.error(e);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    setNotifications(value);
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { notificationsEnabled: value });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 section-y">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage preferences and account options.</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Name</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Email</label>
            <input value={user?.email || ''} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50" />
          </div>
        </div>
        <div className="mt-4">
          <button onClick={saveProfile} disabled={saving} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button>
        </div>
      </div>

      {/* Preferences card */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
        <label className="mt-4 flex items-center">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-black focus:ring-black mr-2"
            checked={notifications}
            onChange={(e) => toggleNotifications(e.target.checked)}
          />
          <span className="text-gray-700">Enable notifications</span>
        </label>
      </div>

      {/* Support */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Support</h2>
        <div className="mt-4 flex gap-3">
          <a href="mailto:support@typeb.app" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Contact Support</a>
          <a href="mailto:bugs@typeb.app?subject=Bug%20Report" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Report a Bug</a>
        </div>
      </div>
    </div>
  );
}


