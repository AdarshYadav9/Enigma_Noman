"use client";

import DailyTracker from '../../components/DailyTracker';
import { CalendarDays } from 'lucide-react';

export default function TrackerPage() {
  return (
    <div className="pb-12 animate-in fade-in duration-500">
      
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#15171A] flex items-center gap-3">
          <CalendarDays className="text-[#1677FF]" size={28} />
          Daily Intake Tracker
        </h1>
        <p className="text-[#69707A] mt-2 max-w-xl leading-relaxed">
          Monitor your logged items against configured daily parameters based on your profile.
        </p>
      </header>

      <DailyTracker />
    </div>
  );
}
