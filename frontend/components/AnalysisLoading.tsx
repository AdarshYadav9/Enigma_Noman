"use client";

import { useEffect, useState } from 'react';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

const STEPS = [
  "Identifying food & normalizing...",
  "Reviewing health profile & conditions...",
  "Checking allergen cross-references...",
  "Analyzing nutrition against condition thresholds...",
  "Screening personalized safe alternatives...",
  "Finalizing assessment report..."
];

export default function AnalysisLoading() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 700);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-[28px] p-8 sm:p-12 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] text-center max-w-md mx-auto animate-in fade-in">
      <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full border-4 border-[#1677FF]/20 border-t-[#1677FF] animate-spin absolute" />
        <Sparkles className="text-[#1677FF] animate-pulse" size={32} />
      </div>

      <h3 className="text-xl font-extrabold text-[#15171A] mb-2">
        Analyzing Food Item
      </h3>
      <p className="text-xs text-[#69707A] mb-6">
        Rule-matching ingredients and nutrition against your health profile
      </p>

      {/* Steps List */}
      <div className="space-y-2 text-left bg-[#F4F5F7] p-4 rounded-2xl border border-[#E5E8EC]">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={idx}
              className={`flex items-center gap-2.5 text-xs transition-opacity duration-300 ${
                isDone
                  ? "text-[#52C41A] font-semibold"
                  : isCurrent
                  ? "text-[#1677FF] font-bold"
                  : "text-[#69707A]/50 font-normal"
              }`}
            >
              {isDone ? (
                <CheckCircle2 size={14} className="shrink-0" />
              ) : isCurrent ? (
                <Loader2 size={14} className="animate-spin shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />
              )}
              <span>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
