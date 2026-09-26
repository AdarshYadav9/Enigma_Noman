"use client";

import { useState } from 'react';
import { useTrackerStore } from '../store/trackerStore';
import { useUserStore } from '../store/userStore';
import RiskBadge from './RiskBadge';
import { 
  Activity, 
  Clock, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  CheckCircle2, 
  X,
  Sparkles
} from 'lucide-react';
import { RiskLevel } from '../types';

export default function DailyTracker() {
  const { meals, addMeal, removeMeal, clearDay } = useTrackerStore();
  const { profile } = useUserStore();
  
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickSodium, setQuickSodium] = useState("350");
  const [quickCarbs, setQuickCarbs] = useState("40");
  const [quickRisk, setQuickRisk] = useState<RiskLevel>("low");

  // Dynamic limits based on user's active health profile
  const hasHypertension = profile?.conditions?.some(c => c.toLowerCase().includes("hypertension") || c.toLowerCase().includes("blood pressure"));
  const hasDiabetes = profile?.conditions?.some(c => c.toLowerCase().includes("diabetes") || c.toLowerCase().includes("sugar"));

  const dailySodiumLimit = profile?.nutrition_thresholds?.sodium_mg || (hasHypertension ? 1500 : 2000);
  const dailyCarbsLimit = profile?.nutrition_thresholds?.carbs_g || (hasDiabetes ? 130 : 250);

  const totalSodium = meals.reduce((sum, meal) => sum + (meal.sodium_mg || 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs_g || 0), 0);

  const sodiumPercent = Math.min(100, Math.round((totalSodium / dailySodiumLimit) * 100));
  const carbsPercent = Math.min(100, Math.round((totalCarbs / dailyCarbsLimit) * 100));
  
  const highRiskCount = meals.filter(m => m.risk_level === 'high').length;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;

    addMeal({
      name: quickName.trim(),
      sodium_mg: parseInt(quickSodium, 10) || 0,
      carbs_g: parseInt(quickCarbs, 10) || 0,
      risk_level: quickRisk,
      timestamp: new Date().toISOString()
    });

    setQuickName("");
    setQuickSodium("350");
    setQuickCarbs("40");
    setShowQuickAdd(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      
      {/* 1. Analytics & Progress Column */}
      <div className="lg:w-1/3 flex flex-col gap-6">
        
        {/* Daily Sodium Card */}
        <div className="bg-white p-7 sm:p-8 rounded-[28px] shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-bold text-[#69707A] uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-[#1677FF]" />
              Daily Sodium
            </h3>
            {hasHypertension && (
              <span className="text-[10px] font-bold text-[#1677FF] bg-[#EAF3FF] px-2 py-0.5 rounded-full border border-[#1677FF]/20">
                Hypertension Limit
              </span>
            )}
          </div>
          
          <div className="mb-5 relative">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-4xl font-extrabold text-[#15171A]">
                {totalSodium}
                <span className="text-base text-[#69707A] font-medium ml-1">mg</span>
              </span>
              <span className="text-sm text-[#69707A] font-semibold">
                / {dailySodiumLimit}mg
              </span>
            </div>
            
            <div className="w-full bg-[#F4F5F7] rounded-full h-3.5 overflow-hidden p-0.5 border border-[#E5E8EC]">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  sodiumPercent > 85 ? 'bg-[#FF4D4F]' : sodiumPercent > 50 ? 'bg-[#FAAD14]' : 'bg-[#52C41A]'
                }`} 
                style={{ width: `${sodiumPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#69707A] font-medium mt-1.5">
              <span>0%</span>
              <span>{sodiumPercent}% consumed</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Status Message */}
          <div className={`p-4 rounded-2xl border text-sm leading-relaxed ${
            highRiskCount > 0 
              ? 'bg-[#FFF1F0] border-[#FF4D4F]/20 text-[#FF4D4F]' 
              : sodiumPercent > 80 
                ? 'bg-[#FFFBE6] border-[#FAAD14]/30 text-[#D48806]' 
                : 'bg-[#F9FBFF] border-[#E5E8EC] text-[#1677FF]'
          }`}>
            {highRiskCount > 0 ? (
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span className="font-semibold text-xs">
                  Requires Attention: You logged {highRiskCount} meal(s) with higher dietary concern.
                </span>
              </div>
            ) : sodiumPercent > 80 ? (
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span className="font-semibold text-xs">
                  Approaching configured threshold ({totalSodium}mg / {dailySodiumLimit}mg).
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span className="font-medium text-xs">
                  Your logged intake is within configured parameters.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Daily Carbohydrates Card (shown if diabetes is tracked or carbs logged) */}
        {(hasDiabetes || totalCarbs > 0) && (
          <div className="bg-white p-7 sm:p-8 rounded-[28px] shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-[#69707A] uppercase tracking-wider flex items-center gap-2">
                <Flame size={16} className="text-[#FAAD14]" />
                Daily Carbohydrates
              </h3>
              {hasDiabetes && (
                <span className="text-[10px] font-bold text-[#FAAD14] bg-[#FFFBE6] px-2 py-0.5 rounded-full border border-[#FAAD14]/20">
                  Target for Diabetes
                </span>
              )}
            </div>

            <div className="flex justify-between items-baseline mb-2">
              <span className="text-3xl font-extrabold text-[#15171A]">
                {totalCarbs}
                <span className="text-sm text-[#69707A] font-medium ml-1">g</span>
              </span>
              <span className="text-sm text-[#69707A] font-semibold">
                / {dailyCarbsLimit}g
              </span>
            </div>

            <div className="w-full bg-[#F4F5F7] rounded-full h-3 overflow-hidden border border-[#E5E8EC]">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  carbsPercent > 85 ? 'bg-[#FF4D4F]' : carbsPercent > 50 ? 'bg-[#FAAD14]' : 'bg-[#1677FF]'
                }`} 
                style={{ width: `${carbsPercent}%` }}
              />
            </div>
          </div>
        )}

      </div>

      {/* 2. Meal Log Column */}
      <div className="lg:w-2/3">
        <div className="bg-white p-7 sm:p-8 rounded-[28px] shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] h-full min-h-[420px] flex flex-col justify-between">
          <div>
            {/* Header with Counter & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-[#15171A] flex items-center gap-2.5">
                  Meal Log
                  <span className="bg-[#F4F5F7] text-[#69707A] text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    {meals.length} {meals.length === 1 ? 'item' : 'items'}
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(!showQuickAdd)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-[#EAF3FF] text-[#1677FF] hover:bg-blue-100 transition-colors shadow-xs"
                >
                  {showQuickAdd ? <X size={14} /> : <Plus size={14} />}
                  <span>{showQuickAdd ? 'Cancel' : 'Quick Log'}</span>
                </button>

                {meals.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear today's logged meals?")) {
                        clearDay();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-[#69707A] hover:text-[#FF4D4F] hover:bg-[#FFF1F0] transition-all"
                  >
                    <Trash2 size={14} /> Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Quick Add Form */}
            {showQuickAdd && (
              <form onSubmit={handleQuickAdd} className="mb-6 p-5 bg-[#F9FBFF] border border-[#1677FF]/20 rounded-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1677FF] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} /> Quick Log Food Item
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-bold text-[#69707A] block mb-1">Meal / Food Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Oatmeal with fruit, Dal Makhani"
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E8EC] rounded-xl text-sm font-semibold text-[#15171A] focus:outline-none focus:border-[#1677FF]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#69707A] block mb-1">Sodium (mg)</label>
                    <input
                      type="number"
                      value={quickSodium}
                      onChange={(e) => setQuickSodium(e.target.value)}
                      min="0"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E8EC] rounded-xl text-sm font-semibold text-[#15171A] focus:outline-none focus:border-[#1677FF]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#69707A] block mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      value={quickCarbs}
                      onChange={(e) => setQuickCarbs(e.target.value)}
                      min="0"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E8EC] rounded-xl text-sm font-semibold text-[#15171A] focus:outline-none focus:border-[#1677FF]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#69707A] block mb-1">Risk Concern</label>
                    <select
                      value={quickRisk}
                      onChange={(e) => setQuickRisk(e.target.value as RiskLevel)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E8EC] rounded-xl text-sm font-semibold text-[#15171A] focus:outline-none focus:border-[#1677FF]"
                    >
                      <option value="low">Low Risk</option>
                      <option value="moderate">Moderate Risk</option>
                      <option value="high">High Risk</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1677FF] hover:bg-blue-600 text-white font-bold text-xs rounded-full shadow-sm transition-all"
                  >
                    Add Meal to Log
                  </button>
                </div>
              </form>
            )}

            {/* Empty State */}
            {meals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-[#F4F5F7] rounded-full flex items-center justify-center text-[#69707A] mb-3">
                  <Clock size={28} />
                </div>
                <p className="text-[#15171A] font-bold text-base">No meals logged today</p>
                <p className="text-[#69707A] text-xs mt-1 max-w-xs">
                  Analyze food from the dashboard and click &ldquo;Add to Daily Log&rdquo;, or use Quick Log above.
                </p>
              </div>
            ) : (
              /* Meal Log List */
              <div className="space-y-2.5">
                {meals.map(meal => (
                  <div 
                    key={meal.id} 
                    className="flex justify-between items-center p-4 bg-white border border-[#E5E8EC] rounded-2xl hover:border-gray-300 transition-all shadow-xs group"
                  >
                    <div className="min-w-0 pr-3">
                      <h4 className="font-bold text-[#15171A] capitalize text-base truncate">
                        {meal.name}
                      </h4>
                      <div className="flex items-center gap-2.5 text-xs text-[#69707A] mt-1 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> 
                          {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[#E5E8EC]" />
                        <span className="font-semibold text-[#15171A]">{meal.sodium_mg}mg Sodium</span>
                        {meal.carbs_g > 0 && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-[#E5E8EC]" />
                            <span>{meal.carbs_g}g Carbs</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <RiskBadge risk_level={meal.risk_level} />
                      <button
                        type="button"
                        onClick={() => removeMeal(meal.id)}
                        aria-label={`Delete ${meal.name}`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#FF4D4F] hover:bg-[#FFF1F0] transition-colors opacity-80 group-hover:opacity-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          {meals.length > 0 && (
            <div className="pt-4 mt-6 border-t border-[#E5E8EC] flex flex-wrap items-center justify-between text-xs text-[#69707A]">
              <span>Logged values automatically sync to your device storage.</span>
              <span className="font-semibold text-[#15171A]">
                Total: {totalSodium}mg Na | {totalCarbs}g Carbs
              </span>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
