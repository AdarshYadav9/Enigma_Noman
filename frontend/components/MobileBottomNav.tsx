"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, ArrowLeftRight, User, ScanLine } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  
  const items = [
    { name: 'Home', href: '/', icon: LayoutDashboard },
    { name: 'Tracker', href: '/tracker', icon: CalendarDays },
    { name: 'Scan', href: '/#scan', icon: ScanLine },
    { name: 'Compare', href: '/compare', icon: ArrowLeftRight },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav aria-label="Primary" className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[#E5E8EC] pb-safe z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(item => {
          const basePath = item.href.split('#')[0] || '/';
          const isScan = item.href.includes('#scan');
          const isActive = isScan
            ? pathname === '/'
            : pathname === basePath || (pathname.startsWith(basePath) && basePath !== '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-[60px] transition-colors ${isActive ? 'text-[#1677FF]' : 'text-[#69707A]'}`}
            >
              <div className={`p-1.5 rounded-full ${isActive ? 'bg-[#EAF3FF]' : ''}`}>
                <item.icon size={22} aria-hidden="true" />
              </div>
              <span className="text-[10px] font-medium mt-1">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  );
}
