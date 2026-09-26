"use client";

import { useState } from 'react';
import { AlternativeFood } from '../types';
import { Sparkles, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { analyzeFood } from '../services/api';
import { useUserStore } from '../store/userStore';

interface AlternativeFoodCardProps {
  alternatives?: AlternativeFood[];
  message?: string | null;
}

export default function AlternativeFoodCard({ alternatives = [], message }: AlternativeFoodCardProps) {
  const { setCurrentAnalysis, setDishName } = useUserStore();
  const [analyzingDish, setAnalyzingDish] = useState<string | null>(null);

  const handleAnalyzeAlternative = async (altName: string) => {
    try {
      setAnalyzingDish(altName);
      const newResult = await analyzeFood({
        food_name: altName,
        food_source: "home"
      });
      setDishName(altName);
      setCurrentAnalysis(newResult);
    } catch (err) {
      console.error("Failed to analyze alternative:", err);
    } finally {
      setAnalyzingDish(null);
    }
  };

  return (
    <section className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-[#F6FFED] text-[#52C41A] flex items-center justify-center">
          <Sparkles size={18} />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#15171A]">Better Alternatives for You</h3>
          <p className="text-xs text-[#69707A]">
            Screened against your health profile, allergies, and dietary restrictions
          </p>
        </div>
      </div>

      {alternatives.length === 0 ? (
        <div className="p-6 bg-[#F4F5F7] rounded-2xl text-center">
          <p className="text-sm font-medium text-[#69707A]">
            {message || "No sufficiently verified alternative was found that matches your profile."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alternatives.map((alt, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-gradient-to-br from-white to-[#F6FFED]/30 border border-[#52C41A]/30 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-extrabold text-[#15171A] capitalize">
                    {alt.name}
                  </h4>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F6FFED] text-[#52C41A] border border-[#52C41A]/30 text-xs font-bold">
                    <CheckCircle2 size={13} /> Low Risk
                  </span>
                </div>

                <p className="text-xs text-[#69707A] leading-relaxed mb-4">
                  {alt.reason}
                </p>
              </div>

              <button
                onClick={() => handleAnalyzeAlternative(alt.name)}
                disabled={analyzingDish === alt.name}
                className="w-full py-2 px-3 rounded-xl bg-white border border-[#E5E8EC] text-xs font-bold text-[#1677FF] hover:bg-[#E6F4FF] hover:border-[#1677FF] transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60"
              >
                {analyzingDish === alt.name ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>View Full Analysis</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
