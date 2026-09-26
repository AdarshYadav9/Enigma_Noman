"use client";

import { RiskResult } from '../types';
import RiskBadge from './RiskBadge';
import HiddenAlertBox from './HiddenAlertBox';
import { Activity, ShieldCheck, AlertCircle, Search } from 'lucide-react';

export default function RiskCard({ result, dishName }: { result: RiskResult, dishName: string }) {
  // Get all flagged ingredients (from both risk flags and hidden alerts)
  const flaggedIngredients = new Set([
    ...result.flags.map(f => f.ingredient.toLowerCase()),
    ...result.hidden_alerts.map(h => h.term.toLowerCase())
  ]);

  // Safe ingredients: from ingredients_found if available, otherwise from flags/hidden_alerts complement
  const sourceIngredients = result.ingredients_found && result.ingredients_found.length > 0
    ? result.ingredients_found
    : [...new Set([...result.flags.map(f => f.ingredient), ...result.hidden_alerts.map(h => h.term)])];

  const safeIngredients = sourceIngredients.filter(i =>
    !flaggedIngredients.has(i.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Overall Assessment */}
      <section className="bg-white rounded-[28px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="text-[#1677FF]" size={20} />
          <h2 className="text-sm font-bold text-[#69707A] uppercase tracking-wider">Analysis Summary</h2>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#15171A] capitalize mb-2">{dishName}</h1>
            <p className="text-[#69707A] max-w-sm leading-relaxed">
              {result.explanation ||
                "Based on the ingredients and your selected dietary profile, we have identified some areas that may require closer review."}
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-start md:items-end">
            <span className="text-[11px] font-bold text-[#69707A] uppercase tracking-widest mb-2">Relative Ingredient Concern</span>
            <RiskBadge risk_level={result.risk_level} />
          </div>
        </div>
      </section>

      {/* Sodium Check */}
      {result.sodium_warning && (() => {
        const exceeded = result.sodium_warning.split("for:")[1] ?? "";
        const labels = exceeded.split(",").map(s => s.trim()).filter(Boolean);

        return (
          <section className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#FF4D4F]/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-full bg-gradient-to-l from-[#FFF1F0] to-transparent opacity-60 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center">
              <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 relative">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#FF4D4F" strokeOpacity="0.15" strokeWidth="12" />
                  <circle
                    cx="60" cy="60" r="48" fill="none" stroke="#FF4D4F" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={0}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="text-[#FF4D4F] mb-1" size={22} />
                  <span className="text-[10px] font-bold text-[#FF4D4F] uppercase leading-tight">Over limit</span>
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-[#15171A] mb-2 flex items-center gap-2">
                  <AlertCircle className="text-[#FF4D4F] shrink-0" size={20} />
                  Sodium Consideration
                </h3>
                <p className="text-[#69707A] mb-3 leading-relaxed">
                  Your selected profile includes a sodium-sensitive condition. This item is historically prepared with high sodium levels.
                </p>
                {labels.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {labels.map(label => (
                      <span key={label} className="px-2.5 py-1 bg-[#FFF1F0] border border-[#FF4D4F]/20 text-[#FF4D4F] rounded-full text-xs font-bold">
                        {label}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs font-medium text-[#15171A] bg-[#F4F5F7] inline-block px-3 py-1.5 rounded-lg border border-[#E5E8EC]">
                  Consider discussing persistent concerns with your clinician. Values vary by serving size.
                </p>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Hidden Ingredients */}
      {result.hidden_alerts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Search className="text-[#1677FF]" size={24} />
            <h3 className="text-xl font-bold text-[#15171A]">Hidden Ingredient Alerts</h3>
          </div>
          <p className="text-sm text-[#69707A] mb-4">Terms on labels that may require closer attention.</p>
          <div className="flex flex-col gap-3">
            {result.hidden_alerts.map(alert => (
              <HiddenAlertBox
                key={alert.term}
                term={alert.term}
                reason={alert.meaning}
                alternatives={[]}
              />
            ))}
          </div>
        </section>
      )}

      {/* Ingredient Breakdown */}
      {result.flags.length > 0 && (
        <section>
          <h3 className="text-xl font-bold text-[#15171A] mb-4">Condition-Specific Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.flags.map((flag, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-[#E5E8EC] shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-[#1677FF]/30 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-[#15171A] capitalize text-lg">{flag.ingredient}</span>
                  <RiskBadge risk_level={flag.risk_level} />
                </div>
                <div className="inline-block px-2 py-1 bg-[#F4F5F7] rounded text-xs font-bold text-[#69707A] uppercase tracking-wider mb-2">
                  For {flag.condition}
                </div>
                <p className="text-sm text-[#69707A] leading-relaxed">
                  {flag.reason}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lower Concern Ingredients */}
      {safeIngredients.length > 0 && (
        <section className="bg-white rounded-[28px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="text-[#52C41A]" size={24} />
            <h3 className="text-xl font-bold text-[#15171A]">Lower-Concern Ingredients</h3>
          </div>
          <p className="text-sm text-[#69707A] mb-6">These ingredients were not flagged for your selected profiles in this analysis.</p>
          
          <div className="flex flex-wrap gap-2">
            {safeIngredients.map(ing => (
              <span key={ing} className="px-3 py-1.5 bg-[#F6FFED] border border-[#52C41A]/20 text-[#52C41A] rounded-full text-sm font-bold capitalize">
                {ing}
              </span>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
