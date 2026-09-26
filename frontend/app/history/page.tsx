"use client";

import Link from 'next/link';
import { Clock, Search, Filter } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="pb-12 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#15171A] flex items-center gap-3">
          <Clock className="text-[#1677FF]" size={28} />
          Analysis History
        </h1>
        <p className="text-[#69707A] mt-2 max-w-xl">
          View your previous food analyses and risk assessments.
        </p>
      </header>

      <div className="bg-white rounded-[28px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#69707A]" size={20} />
            <input
              type="text"
              placeholder="Search history..."
              className="w-full bg-[#F4F5F7] border border-[#E5E8EC] rounded-2xl py-3 pl-12 pr-4 text-[#15171A] focus:outline-none focus:ring-2 focus:ring-[#EAF3FF] focus:border-[#1677FF] transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-white border border-[#E5E8EC] rounded-2xl text-[#69707A] hover:border-[#1677FF] hover:text-[#1677FF] transition-all">
            <Filter size={18} />
            Filters
          </button>
        </div>

        <div className="text-center py-16">
          <div className="w-20 h-20 bg-[#F4F5F7] rounded-full flex items-center justify-center text-[#69707A] mx-auto mb-4">
            <Clock size={32} />
          </div>
          <h3 className="text-xl font-bold text-[#15171A] mb-2">No History Yet</h3>
          <p className="text-[#69707A] mb-6 max-w-sm mx-auto">
            Analyze foods from the dashboard to build your history.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1677FF] text-white rounded-2xl font-bold hover:bg-[#155ACC] transition-all">
            Start Analysis
          </Link>
        </div>
      </div>
    </div>
  );
}