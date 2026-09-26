"use client";
import Link from 'next/link';
import { Search, Bell, HelpCircle } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-[#F4F5F7]/80 backdrop-blur-md">
      <div className="flex-1 max-w-xl hidden md:flex">
        <div className="relative w-full">
          <label htmlFor="global-search" className="sr-only">Search dishes, ingredients, or previous analyses</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#69707A]" size={18} aria-hidden="true" />
          <input 
            id="global-search"
            type="search" 
            placeholder="Search ingredients, previous analysis, or Indian dishes..." 
            className="w-full bg-white border border-[#E5E8EC] rounded-full py-2.5 pl-10 pr-4 text-[14px] text-[#15171A] placeholder:text-[#69707A] focus:outline-none focus:ring-2 focus:ring-[#EAF3FF] focus:border-[#1677FF] shadow-sm transition-all"
          />
        </div>
      </div>

      <div className="flex-1 md:hidden">
        {/* Mobile Spacer */}
      </div>

      <div className="flex items-center gap-3 sm:gap-4 ml-4">
        <button aria-label="Help and guidance" className="w-10 h-10 rounded-full bg-white border border-[#E5E8EC] flex items-center justify-center text-[#69707A] hover:text-[#1677FF] hover:bg-[#EAF3FF] transition-all shadow-sm">
          <HelpCircle size={18} />
        </button>
        <button aria-label="Notifications" className="relative w-10 h-10 rounded-full bg-white border border-[#E5E8EC] flex items-center justify-center text-[#69707A] hover:text-[#1677FF] hover:bg-[#EAF3FF] transition-all shadow-sm">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF4D4F] border border-white"></span>
        </button>
        <Link
          href="/profile"
          aria-label="Open your profile"
          className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1677FF] to-blue-400 border-2 border-white shadow-sm shrink-0 transition-transform hover:scale-105"
        />
      </div>
    </header>
  );
}
