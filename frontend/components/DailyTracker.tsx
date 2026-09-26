"use client";

import { useTrackerStore } from '../store/trackerStore';
import RiskBadge from './RiskBadge';
import { Activity, Clock, Trash2 } from 'lucide-react';

export default function DailyTracker() {
  const { meals, clearDay } = useTrackerStore();
  
  const dailySodiumLimit = 1500;
  const totalSodium = meals.reduce((sum, meal) => sum + meal.sodium_mg, 0);
  const sodiumPercent = Math.min(100, Math.round((totalSodium / dailySodiumLimit) * 100));
  
  const highRiskCount = meals.filter(m => m.risk_level === 'high').length;

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      
      {/* Analytics Column */}
      <div className="lg:w-1/3 flex flex-col gap-6">
        <div className="bg-white p-8 rounded-[28px] shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
          <h2 className="text-sm font-bold text-[#69707A] uppercase tracking-wider mb-6 flex items-center gap-2">
            <Activity size={16} className="text-[#1677FF]" />
            Daily Sodium
          </h2>
          
          <div className="mb-6 relative">
            <div className="flex justify-between items-end mb-2">
              <span className="text-4xl font-extrabold text-[#15171A]">{totalSodium}<span className="text-lg text-[#69707A] font-medium">mg</span></span>
              <span className="text-sm text-[#69707A] font-medium mb-1">/ {dailySodiumLimit}mg</span>
            </div>
            
            <div className="w-full bg-[#F4F5F7] rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  sodiumPercent > 85 ? 'bg-[#FF4D4F]' : sodiumPercent > 50 ? 'bg-[#FAAD14]' : 'bg-[#52C41A]'
                }`} 
                style={{ width: `${sodiumPercent}%` }}
              ></div>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl bg-[#F9FBFF] border border-[#E5E8EC] text-sm text-[#69707A] leading-relaxed">
            {highRiskCount > 0 ? (
              <span className="text-[#FF4D4F] font-bold">Requires Attention: You logged {highRiskCount} meal(s) with higher concern.</span>
            ) : sodiumPercent > 80 ? (
              <span className="text-[#FAAD14] font-bold">Approaching configured threshold.</span>
            ) : (
              <span className="text-[#1677FF] font-medium">Your logged intake is within configured parameters.</span>
            )}
          </div>
        </div>
      </div>

      {/* Log Column */}
      <div className="lg:w-2/3">
        <div className="bg-white p-8 rounded-[28px] shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] h-full min-h-[400px]">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-xl font-bold text-[#15171A] flex items-center gap-2">
              Meal Log
              <span className="bg-[#F4F5F7] text-[#69707A] text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">{meals.length} items</span>
            </h2>
            {meals.length > 0 && (
              <button
                onClick={clearDay}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#69707A] hover:text-[#FF4D4F] hover:bg-[#FFF1F0] transition-all shrink-0"
              >
                <Trash2 size={14} /> Clear
              </button>
            )}
          </div>
          
          {meals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="w-16 h-16 bg-[#F4F5F7] rounded-full flex items-center justify-center text-[#69707A] mb-4">
                <Clock size={24} />
              </div>
              <p className="text-[#15171A] font-bold">No meals logged today</p>
              <p className="text-[#69707A] text-sm mt-1">Analyze a food and click &ldquo;Add to Log&rdquo;</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {meals.map(meal => (
                <div key={meal.id} className="flex justify-between items-center p-4 border border-[#E5E8EC] rounded-2xl hover:border-[#1677FF]/30 transition-all">
                  <div>
                    <h3 className="font-bold text-[#15171A] capitalize text-lg">{meal.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-[#69707A] mt-1 font-medium">
                      <span className="flex items-center gap-1"><Clock size={12}/> {new Date(meal.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span className="w-1 h-1 rounded-full bg-[#E5E8EC]"></span>
                      <span>{meal.sodium_mg}mg Sodium</span>
                    </div>
                  </div>
                  <div>
                    <RiskBadge risk_level={meal.risk_level} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
