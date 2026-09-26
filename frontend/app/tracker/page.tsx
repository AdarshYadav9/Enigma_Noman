"use client";

import DailyTracker from '../../components/DailyTracker';

export default function TrackerPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-extrabold text-gray-900">Daily Intake Tracker</h1>
          <p className="text-gray-500 mt-2">Monitor your meals against your specific health conditions.</p>
        </header>
        
        <DailyTracker />
      </div>
    </div>
  );
}
