'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomTabNav() {
  const pathname = usePathname();

  const items = [
    { label: 'Home', href: '/dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-9 2v8m-4 0h8a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z"/></svg>
    )},
    { label: 'Tasks', href: '/dashboard/tasks', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    )},
    { label: 'Family', href: '/dashboard/family', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 14a4 4 0 00-8 0M12 7a4 4 0 110-8 4 4 0 010 8zM6 22v-2a4 4 0 014-4h0a4 4 0 014 4v2M2 22v-2a6 6 0 016-6"/></svg>
    )},
    { label: 'Analytics', href: '/dashboard/analytics', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 13l3 3 7-7"/></svg>
    )},
    { label: 'Settings', href: '/dashboard/settings', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l.7 2.154a1 1 0 00.95.69h2.262a1 1 0 01.592 1.806l-1.833 1.333a1 1 0 00-.364 1.118l.7 2.154c.3.921-.755 1.688-1.54 1.118l-1.833-1.333a1 1 0 00-1.175 0l-1.833 1.333c-.784.57-1.838-.197-1.539-1.118l.7-2.154a1 1 0 00-.364-1.118L5.54 7.577A1 1 0 016.132 5.77h2.262a1 1 0 00.95-.69l.7-2.154z"/></svg>
    )},
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t shadow-small lg:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 flex flex-col items-center justify-center py-2 text-xs ${
                  isActive ? 'text-gray-900' : 'text-gray-500'
                }`}
                title={item.label}
              >
                {item.icon}
                <span className="mt-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


