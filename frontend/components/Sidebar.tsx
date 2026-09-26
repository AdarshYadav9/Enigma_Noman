"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ScanLine, CalendarDays, ArrowLeftRight, History, User, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export default function Sidebar() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Compare Foods', href: '/compare', icon: ArrowLeftRight },
    { name: 'Daily Intake', href: '/tracker', icon: CalendarDays },
  ];

  const bottomItems: NavItem[] = [
    { name: 'History', href: '/history', icon: History },
    { name: 'My Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
    return (
      <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-[#1677FF] text-white shadow-md' : 'text-[#69707A] hover:bg-[#EAF3FF] hover:text-[#1677FF]'}`}>
        <item.icon size={20} aria-hidden="true" className={isActive ? 'text-white' : 'text-current'} />
        <span className="font-medium text-[14px]">{item.name}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed left-6 top-6 bottom-6 w-64 bg-white rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-[#E5E8EC] hidden md:flex flex-col z-40 overflow-hidden">
      <div className="p-6 flex items-center gap-3 border-b border-[#E5E8EC]">
        <div className="w-10 h-10 rounded-xl bg-[#EAF3FF] text-[#1677FF] flex items-center justify-center font-bold text-xl shrink-0">
          <ScanLine size={24} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[#15171A] text-[15px] leading-tight">Food<br/>Intelligence</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold text-[#69707A] uppercase tracking-wider">Analysis</div>
          {navItems.map(item => <NavLink key={item.name} item={item} />)}
        </div>
      </div>

      <div className="p-4 space-y-1 border-t border-[#E5E8EC]">
        {bottomItems.map(item => <NavLink key={item.name} item={item} />)}
      </div>
    </aside>
  );
}
