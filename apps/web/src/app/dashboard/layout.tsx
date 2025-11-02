'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authAdapter } from '@/lib/firebase/auth-adapter';
import dynamic from 'next/dynamic';
const BottomTabNav = dynamic(() => import('@/components/ui/BottomTabNav'), { ssr: false });
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { analytics } from '@/services/analytics';
import { User } from '@typeb/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    // E2E/test bypass: allow unauthenticated render when ?e2e=1 is present
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('e2e') === '1') {
          setUser({ id: 'e2e', displayName: 'E2E Tester', email: 'e2e@example.com' } as unknown as User);
          setIsLoading(false);
          return;
        }
      }
    } catch {}

    let firstResolved = false;
    const unsubscribe = authAdapter.onAuthStateChanged((u) => {
      firstResolved = true;
      setUser(u);
      setIsLoading(false);
      if (!u) router.replace('/login');
    });

    const hydrationGuard = setTimeout(() => {
      if (!firstResolved) setIsLoading(true);
    }, 1200);

    return () => {
      unsubscribe();
      clearTimeout(hydrationGuard);
    };
  }, [router]);

  const handleSignOut = async () => {
    try {
      await authAdapter.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: (<Icon name="home" />) },
    { name: 'Tasks', href: '/dashboard/tasks', icon: (<Icon name="task" />) },
    { name: 'Family', href: '/dashboard/family', icon: (<Icon name="users" />) },
    { name: 'Analytics', href: '/dashboard/analytics', icon: (<Icon name="chart" />) },
    { name: 'Validation', href: '/dashboard/validation', icon: (<Icon name="check" />) },
    { name: 'Settings', href: '/dashboard/settings', icon: (<Icon name="cog" />) },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <div className="flex items-center gap-2">
              <img src="/type_b_logo.png" alt="TypeB" className="h-8 w-8" />
              <h1 className="text-xl font-semibold">TypeB Family</h1>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg">
                  {user?.displayName?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const isValidation = item.name === 'Validation';
              if (isValidation && user?.role !== 'parent') return null;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.name}
                  className={`flex items-center px-3 py-2 rounded-lg transition border-l-4 ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 border-l-gray-900'
                      : 'text-gray-700 hover:bg-gray-50 border-l-transparent'
                  }`}
                  onClick={() => analytics.trackCTAClick(item.name, 'sidebar')}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sign out button */}
          <div className="p-4 border-t">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white border-b">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden"
              aria-label="Open navigation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="relative flex items-center space-x-4">
              {/* Notification bell */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900" aria-label="Notifications" onClick={()=>{ setIsNotifOpen(!isNotifOpen); setIsUserMenuOpen(false); }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User avatar */}
              <button aria-label="User menu" onClick={()=>{ setIsUserMenuOpen(!isUserMenuOpen); setIsNotifOpen(false); }} className="rounded-full focus:outline-none focus:ring-2 focus:ring-black">
                <Avatar name={user?.displayName || 'User'} src={user?.avatarUrl} size={32} />
              </button>

              {/* Notifications popover */}
              {isNotifOpen && (
                <div className="absolute right-16 top-12 z-40 bg-white rounded-xl shadow-large border w-72 p-3">
                  <p className="text-sm font-medium text-gray-900 mb-2">Notifications</p>
                  <p className="text-sm text-gray-600">You're all caught up.</p>
                  <div className="mt-3 text-right">
                    <a href="/dashboard/settings" className="text-sm text-black hover:underline">Notification settings</a>
                  </div>
                </div>
              )}
              {/* User menu popover */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-12 z-40 bg-white rounded-xl shadow-large border w-56 p-2">
                  <a href="/dashboard" className="block px-3 py-2 text-sm hover:bg-gray-50">Dashboard</a>
                  <a href="/dashboard/settings" className="block px-3 py-2 text-sm hover:bg-gray-50">Settings</a>
                  <button onClick={handleSignOut} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Sign out</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="screen-container section-stack-lg" onKeyDown={(e)=>{
          if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
            window.location.href = '/dashboard/tasks/new';
          }
          if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
            const inputs = document.querySelectorAll('input, textarea, select');
            (inputs[0] as HTMLInputElement)?.focus();
            e.preventDefault();
          }
          if ((e.key.toLowerCase() === 'g') && !e.metaKey && !e.ctrlKey && !e.altKey) {
            window.location.href = '/dashboard';
          }
        }} tabIndex={0}>
          {children}
        </main>
        <BottomTabNav />
      </div>
    </div>
  );
}