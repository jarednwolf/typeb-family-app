'use client';

import { useEffect, useState } from 'react';
import { requestNotificationPermission } from '@/services/push';
import SettingsSection from '@/components/settings/SettingsSection';
import { openSystemNotificationSettings } from '@/services/browser';
import { authAdapter } from '@/lib/firebase/auth-adapter';
import { auth, db } from '@/lib/firebase/config';
import { updateProfile, updatePassword, reauthenticateWithPopup, GoogleAuthProvider } from 'firebase/auth';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { User } from '@typeb/types';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/components/ui/ToastProvider';
import UpgradeModal from '@/components/premium/UpgradeModal';

export default function SettingsPage() {
  const { show } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [pwdOpen, setPwdOpen] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [uploading, setUploading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [isE2E, setIsE2E] = useState(false);

  useEffect(() => {
    // E2E/test bypass flag
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('e2e') === '1') {
          setIsE2E(true);
        }
      }
    } catch {}

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
      show('Profile updated', 'success');
    } catch (e) {
      console.error(e);
      show('Failed to update profile', 'error');
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
      <SettingsSection>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage preferences and account options.</p>
      </SettingsSection>

      {/* Profile card */}
      <SettingsSection title="Profile">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={user?.displayName || 'User'} src={user?.avatarUrl} size={48} />
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;
                  setUploading(true);
                  try {
                    const r = ref(storage, `avatars/${user.id}`);
                    await uploadBytes(r, file);
                    const url = await getDownloadURL(r);
                    await updateDoc(doc(db, 'users', user.id), { avatarUrl: url });
                    setUser({ ...user, avatarUrl: url });
                  } catch (e) {
                    console.error(e);
                    show('Upload failed', 'error');
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              {uploading && <p className="text-xs text-gray-500" role="status" aria-live="polite">Uploading...</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Name</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} className="form-control" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Email</label>
            <input value={user?.email || ''} readOnly className="form-control bg-gray-50" />
          </div>
        </div>
        <div>
          <button onClick={saveProfile} disabled={saving || !name} className="px-4 py-2 btn btn-primary disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button>
        </div>
      </SettingsSection>

      {/* Preferences card */}
      <SettingsSection title="Preferences">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-black focus:ring-black mr-2"
            checked={notifications}
            onChange={(e) => toggleNotifications(e.target.checked)}
          />
          <span className="text-gray-700">Enable notifications</span>
        </label>
        {/* Web push opt-in (best-effort) */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status: <strong>{typeof Notification !== 'undefined' ? Notification.permission : 'unknown'}</strong></span>
          <button
          className="mt-4 btn btn-secondary"
          onClick={async () => {
            const perm = await requestNotificationPermission();
            show(`Notifications permission: ${perm}`, 'info');
          }}
        >
          Request browser notifications
        </button>
          <button className="mt-4 btn btn-secondary" onClick={()=>openSystemNotificationSettings()}>Open browser settings</button>
        </div>
        <div>
          <ThemeToggle />
        </div>
      </SettingsSection>

      {/* Subscription */}
      <SettingsSection title="Subscription" subtitle="Manage your premium plan and billing.">
        <ul className="text-sm text-gray-700 list-disc pl-5">
          <li>Advanced analytics</li>
          <li>Priority validation tools</li>
          <li>Family member expansion</li>
        </ul>
        <div className="flex gap-2">
          {(isE2E || (user && !user.isPremium)) ? (
            <>
              <button
                onClick={()=>setUpgradeOpen(true)}
                className="btn btn-primary"
                aria-label="Open upgrade modal"
              >Upgrade</button>
              <a href="/pricing" className="btn btn-secondary">View plans</a>
            </>
          ) : (
            <>
              <button
                onClick={async ()=>{ const { openBillingPortal } = await import('@/services/billing'); openBillingPortal(); }}
                className="btn btn-primary"
              >Manage subscription</button>
              <a href="/pricing" className="btn btn-secondary">View plans</a>
            </>
          )}
        </div>
        <UpgradeModal open={upgradeOpen} onClose={()=>setUpgradeOpen(false)} />
      </SettingsSection>

      {/* Support */}
      <SettingsSection title="Support">
        <div className="flex gap-3">
          <a href="mailto:support@typeb.app" className="btn btn-secondary" aria-label="Contact support by email">Contact Support</a>
          <a href="mailto:bugs@typeb.app?subject=Bug%20Report" className="btn btn-secondary" aria-label="Report a bug by email">Report a Bug</a>
        </div>
      </SettingsSection>

      {/* Account */}
      <SettingsSection title="Account">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600">Change email</label>
            <div className="flex gap-2">
              <input value={newEmail} onChange={(e)=>setNewEmail(e.target.value)} placeholder="new@email.com" className="form-control flex-1" />
              <button
                onClick={async ()=>{
                  if (!auth.currentUser || !newEmail) return;
                  setEmailSaving(true);
                  try { await auth.currentUser.updateEmail?.(newEmail as any); show('Email updated', 'success'); } catch { show('Email update failed', 'error'); } finally { setEmailSaving(false); }
                }}
                className="btn btn-secondary"
                disabled={emailSaving}
              >{emailSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
        <div>
          <button
            onClick={async ()=>{ if (confirm('Delete account permanently?')) { try { await auth.currentUser?.delete?.(); show('Account deleted', 'success'); location.href='/'; } catch { show('Delete failed', 'error'); } } }}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          >Delete account</button>
        </div>

        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-2">Change password</h3>
          <button className="px-4 py-2 btn btn-secondary" onClick={()=>setPwdOpen(true)}>Update password</button>
        </div>
      </SettingsSection>

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
                  if (!auth.currentUser || newPwd.length < 6) { show('Password too short', 'error'); return; }
                  try { await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider()); } catch {}
                  await updatePassword(auth.currentUser, newPwd);
                  show('Password updated', 'success');
                  setNewPwd('');
                  setPwdOpen(false);
                } catch {
                  show('Password update failed', 'error');
                }
              }}
            >Save</button>
          </>
        )}
      >
        <label className="block text-sm text-gray-600 mb-1">New password</label>
        <input type="password" value={newPwd} onChange={(e)=>setNewPwd(e.target.value)} className="form-control" placeholder="••••••" />
        <p className="text-xs text-gray-500 mt-2">Minimum 6 characters.</p>
      </Modal>
    </div>
  );
}


