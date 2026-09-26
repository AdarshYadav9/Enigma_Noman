"use client";

import { useUserStore } from '../store/userStore';
import ConditionSelector from '../components/ConditionSelector';
import DishSearch from '../components/DishSearch';
import { ShieldCheck, Activity, Info } from 'lucide-react';

export default function Home() {
  const { conditions } = useUserStore();

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <section className="bg-white rounded-[28px] p-6 sm:p-8 md:p-12 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#EAF3FF] to-transparent opacity-50 pointer-events-none"></div>
        
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF3FF] text-[#1677FF] text-xs font-bold uppercase tracking-wider mb-6">
            <ShieldCheck size={14} />
            Dietary Decision Support
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#15171A] leading-[1.1] tracking-tight mb-6">
            Make every food decision <span className="text-[#1677FF]">more informed.</span>
          </h1>
          
          <p className="text-base sm:text-lg text-[#69707A] leading-relaxed max-w-xl">
            Understand ingredient risks based on your personal dietary conditions. Scan packages, menus, or search dishes to reveal hidden concerns.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Dietary Profile */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
            <div className="flex items-center gap-2 mb-4 text-[#15171A]">
              <Activity className="text-[#1677FF]" size={20} />
              <h2 className="text-lg font-bold">My Dietary Profile</h2>
            </div>
            <p className="text-sm text-[#69707A] mb-6">
              Select your conditions to personalize risk alerts.
            </p>
            <ConditionSelector />
            
            <div className="mt-6 p-4 rounded-2xl bg-[#F4F5F7] border border-[#E5E8EC] flex items-start gap-3">
              <Info className="text-[#69707A] shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-[#69707A] leading-relaxed">
                This analysis considers ingredients and dietary profiles selected. Use this information as decision support, not as a diagnosis.
              </p>
            </div>
          </section>
        </div>

        {/* Right Column: Actions */}
        <div className="lg:col-span-8 space-y-6 scroll-mt-24" id="scan">
          {conditions.length === 0 ? (
            <div className="bg-white rounded-[28px] p-12 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <div className="w-16 h-16 bg-[#F4F5F7] rounded-full flex items-center justify-center text-[#69707A] mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#15171A] mb-2">Configure your profile</h3>
              <p className="text-[#69707A] max-w-sm">Select at least one condition from your dietary profile to begin analyzing food.</p>
            </div>
          ) : (
            <section className="bg-white rounded-[28px] p-6 md:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#15171A]">Analyze Food</h2>
                  <p className="text-sm text-[#69707A] mt-1">Select a method to assess dietary risks.</p>
                </div>
              </div>
              <DishSearch />
            </section>
          )}
        </div>

      </div>
    </div>
  );
}
