'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon';

export default function BottomTabNav() {
  const pathname = usePathname();

  const items = [
    { label: 'Home', href: '/dashboard', icon: (<Icon name="home" className="w-5 h-5" />)},
    { label: 'Tasks', href: '/dashboard/tasks', icon: (<Icon name="task" className="w-5 h-5" />)},
    { label: 'Family', href: '/dashboard/family', icon: (<Icon name="users" className="w-5 h-5" />)},
    { label: 'Analytics', href: '/dashboard/analytics', icon: (<Icon name="chart" className="w-5 h-5" />)},
    { label: 'Settings', href: '/dashboard/settings', icon: (<Icon name="cog" className="w-5 h-5" />)},
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


