'use client';

import { useEffect, useState } from 'react';
import { requestNotificationPermission } from '@/services/push';
import { authAdapter } from '@/lib/firebase/auth-adapter';
import { auth, db } from '@/lib/firebase/config';
import { updateProfile, updatePassword, reauthenticateWithPopup, GoogleAuthProvider } from 'firebase/auth';
import Modal from '@/components/ui/Modal';
import { doc, updateDoc } from 'firebase/firestore';
import { User } from '@typeb/types';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [pwdOpen, setPwdOpen] = useState(false);
  const [newPwd, setNewPwd] = useState('');

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
          <button onClick={saveProfile} disabled={saving || !name} className="px-4 py-2 btn btn-primary disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button>
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
        {/* Web push opt-in (best-effort) */}
        <button
          className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          onClick={async () => {
            const perm = await requestNotificationPermission();
            alert(`Notifications permission: ${perm}`);
          }}
        >
          Request browser notifications
        </button>
      </div>

      {/* Support */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Support</h2>
        <div className="mt-4 flex gap-3">
          <a href="mailto:support@typeb.app" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" aria-label="Contact support by email">Contact Support</a>
          <a href="mailto:bugs@typeb.app?subject=Bug%20Report" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" aria-label="Report a bug by email">Report a Bug</a>
        </div>
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Account</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Change email</label>
            <div className="flex gap-2">
              <input value={newEmail} onChange={(e)=>setNewEmail(e.target.value)} placeholder="new@email.com" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg" />
              <button
                onClick={async ()=>{
                  if (!auth.currentUser || !newEmail) return;
                  setEmailSaving(true);
                  try { await auth.currentUser.updateEmail?.(newEmail as any); alert('Email updated'); } catch { alert('Email update failed'); } finally { setEmailSaving(false); }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={emailSaving}
              >{emailSaving ? 'Saving...' : 'Update'}</button>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={async ()=>{ if (confirm('Delete account permanently?')) { try { await auth.currentUser?.delete?.(); alert('Account deleted'); location.href='/'; } catch { alert('Delete failed'); } } }}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          >Delete account</button>
        </div>

        <div className="mt-6">
          <h3 className="text-md font-semibold text-gray-900 mb-2">Change password</h3>
          <button className="px-4 py-2 btn btn-secondary" onClick={()=>setPwdOpen(true)}>Update password</button>
        </div>
      </div>

      <Modal
        open={pwdOpen}
        onClose={()=>setPwdOpen(false)}
        title="Update password"
        footer={(
          <>
            <button className="btn btn-secondary btn-sm" onClick={()=>setPwdOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary btn-sm"
              onClick={async ()=>{
                try {
                  if (!auth.currentUser || newPwd.length < 6) return alert('Password too short');
                  try { await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider()); } catch {}
                  await updatePassword(auth.currentUser, newPwd);
                  alert('Password updated');
                  setNewPwd('');
                  setPwdOpen(false);
                } catch {
                  alert('Password update failed');
                }
              }}
            >Save</button>
          </>
        )}
      >
        <label className="block text-sm text-gray-600 mb-1">New password</label>
        <input type="password" value={newPwd} onChange={(e)=>setNewPwd(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="••••••" />
        <p className="text-xs text-gray-500 mt-2">Minimum 6 characters.</p>
      </Modal>
    </div>
  );
}


