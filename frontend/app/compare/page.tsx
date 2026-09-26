"use client";

import { useState } from 'react';
import { searchDishes, analyzeDish } from '../../services/api';
import { useUserStore } from '../../store/userStore';
import { Dish, RiskResult, RiskLevel } from '../../types';
import { ArrowLeftRight, Loader2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ComparePage() {
  const { conditions } = useUserStore();
  const [dish1, setDish1] = useState("");
  const [dish2, setDish2] = useState("");
  const [res1, setRes1] = useState<RiskResult | null>(null);
  const [res2, setRes2] = useState<RiskResult | null>(null);
  const [d1Data, setD1Data] = useState<Dish | null>(null);
  const [d2Data, setD2Data] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleCompare = async () => {
    if (!dish1 || !dish2 || conditions.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const dbRes1 = await searchDishes(dish1);
      const dbRes2 = await searchDishes(dish2);
      
      if (dbRes1.length === 0 || dbRes2.length === 0) {
        const missing = dbRes1.length === 0 ? dish1 : dish2;
        setError(`We couldn't find "${missing}" in the dish database. Try a different name, or use the Manual tab on the dashboard.`);
        return;
      }

      setD1Data(dbRes1[0]);
      setD2Data(dbRes2[0]);
      
      const r1 = await analyzeDish(dbRes1[0].name, conditions);
      const r2 = await analyzeDish(dbRes2[0].name, conditions);
      
      setRes1(r1);
      setRes2(r2);
    } catch (e) {
      console.error(e);
      setError("Something went wrong while comparing these foods. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const scoreMap: Record<RiskLevel, number> = { "low": 1, "moderate": 2, "high": 3, "unknown": 4 };
  
  let betterChoice: string | null = null;
  let isTie = false;
  if (res1 && res2 && d1Data && d2Data) {
    const s1 = scoreMap[res1.risk_level] ?? 4;
    const s2 = scoreMap[res2.risk_level] ?? 4;
    if (s1 < s2) betterChoice = d1Data.name;
    else if (s2 < s1) betterChoice = d2Data.name;
    else if (d1Data.sodium_mg !== d2Data.sodium_mg) {
      betterChoice = d1Data.sodium_mg < d2Data.sodium_mg ? d1Data.name : d2Data.name;
    } else {
      isTie = true;
    }
  }

  return (
    <div className="pb-12 animate-in fade-in duration-500">
      
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#15171A] flex items-center gap-3">
          <ArrowLeftRight className="text-[#1677FF]" size={28} />
          Compare Foods
        </h1>
        <p className="text-[#69707A] mt-2 max-w-xl">
          Side-by-side analysis of two dishes based on your selected dietary profile.
        </p>
      </header>

      {conditions.length === 0 && (
        <div className="bg-[#FFF1F0] border border-[#FF4D4F]/20 text-[#FF4D4F] p-4 rounded-2xl mb-8 font-bold flex items-center gap-2">
          <AlertCircle size={18} /> Please configure your dietary profile on the dashboard first.
        </div>
      )}

      <div className="bg-white p-6 rounded-[28px] shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-[#15171A] mb-2 uppercase tracking-wide">Food 1</label>
            <input type="text" value={dish1} onChange={(e) => setDish1(e.target.value)} placeholder="e.g. pav bhaji" className="w-full bg-[#F4F5F7] p-4 border border-[#E5E8EC] rounded-2xl focus:ring-2 focus:ring-[#EAF3FF] focus:border-[#1677FF] outline-none transition-all" />
          </div>
          
          <div className="w-12 h-12 shrink-0 rounded-full bg-[#EAF3FF] text-[#1677FF] flex items-center justify-center font-bold mx-auto my-2 md:my-0 md:mb-1">
            VS
          </div>
          
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-[#15171A] mb-2 uppercase tracking-wide">Food 2</label>
            <input type="text" value={dish2} onChange={(e) => setDish2(e.target.value)} placeholder="e.g. idli sambar" className="w-full bg-[#F4F5F7] p-4 border border-[#E5E8EC] rounded-2xl focus:ring-2 focus:ring-[#EAF3FF] focus:border-[#1677FF] outline-none transition-all" />
          </div>
          
          <button onClick={handleCompare} disabled={loading || !dish1 || !dish2 || conditions.length===0} className="w-full md:w-auto px-8 py-4 bg-[#1677FF] text-white rounded-2xl font-bold hover:bg-[#155ACC] shadow-[0_4px_14px_rgba(22,119,255,0.3)] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="animate-spin" size={18} /> Comparing</> : "Compare"}
          </button>
        </div>
        {error && (
          <div role="alert" className="mt-4 bg-[#FFF1F0] border border-[#FF4D4F]/20 text-[#FF4D4F] p-4 rounded-2xl font-medium text-sm flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {res1 && res2 && d1Data && d2Data && (
        <div className="bg-white rounded-[28px] shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[560px] text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FBFF] border-b border-[#E5E8EC]">
                <th className="p-4 sm:p-6 font-bold text-[#69707A] uppercase text-xs tracking-wider w-1/3">Factor</th>
                <th className="p-4 sm:p-6 font-extrabold text-[#15171A] capitalize text-lg sm:text-xl w-1/3">{d1Data.name}</th>
                <th className="p-4 sm:p-6 font-extrabold text-[#15171A] capitalize text-lg sm:text-xl w-1/3">{d2Data.name}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E8EC]">
              <tr>
                <td className="p-4 sm:p-6 font-bold text-[#15171A] text-sm">Relative Concern</td>
                <td className="p-4 sm:p-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${res1.risk_level === 'high' ? 'bg-[#FFF1F0] text-[#FF4D4F]' : res1.risk_level === 'moderate' ? 'bg-[#FFFBE6] text-[#FAAD14]' : 'bg-[#F6FFED] text-[#52C41A]'}`}>
                    {res1.risk_level}
                  </span>
                </td>
                <td className="p-4 sm:p-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${res2.risk_level === 'high' ? 'bg-[#FFF1F0] text-[#FF4D4F]' : res2.risk_level === 'moderate' ? 'bg-[#FFFBE6] text-[#FAAD14]' : 'bg-[#F6FFED] text-[#52C41A]'}`}>
                    {res2.risk_level}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:p-6 font-bold text-[#15171A] text-sm">Sodium</td>
                <td className="p-4 sm:p-6 font-medium text-[#69707A]">{d1Data.sodium_mg} mg</td>
                <td className="p-4 sm:p-6 font-medium text-[#69707A]">{d2Data.sodium_mg} mg</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-6 font-bold text-[#15171A] text-sm">Carbohydrates</td>
                <td className="p-4 sm:p-6 font-medium text-[#69707A]">{d1Data.carbs_g} g</td>
                <td className="p-4 sm:p-6 font-medium text-[#69707A]">{d2Data.carbs_g} g</td>
              </tr>
              {conditions.map(c => {
                const r1_flags = res1.flags.filter(f => f.condition === c).length;
                const r2_flags = res2.flags.filter(f => f.condition === c).length;
                return (
                  <tr key={c}>
                    <td className="p-4 sm:p-6 font-bold text-[#15171A] text-sm capitalize">For {c}</td>
                    <td className="p-4 sm:p-6">
                      {r1_flags > 0 ? (
                        <div className="flex items-center gap-2 text-[#FF4D4F] text-sm font-bold"><AlertCircle size={16} /> Needs Review</div>
                      ) : (
                        <div className="flex items-center gap-2 text-[#52C41A] text-sm font-bold"><CheckCircle2 size={16} /> Lower Concern</div>
                      )}
                    </td>
                    <td className="p-4 sm:p-6">
                      {r2_flags > 0 ? (
                        <div className="flex items-center gap-2 text-[#FF4D4F] text-sm font-bold"><AlertCircle size={16} /> Needs Review</div>
                      ) : (
                        <div className="flex items-center gap-2 text-[#52C41A] text-sm font-bold"><CheckCircle2 size={16} /> Lower Concern</div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
          
          <div className="p-6 bg-[#EAF3FF] border-t border-[#1677FF]/20 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-center">
            <ShieldCheck className="text-[#1677FF] shrink-0" size={24} />
            {isTie ? (
              <>
                <span className="text-[#69707A] font-medium">Both options carry comparable concern.</span>
                <span className="text-lg font-extrabold text-[#1677FF]">No clear winner</span>
              </>
            ) : (
              <>
                <span className="text-[#69707A] font-medium">Lower concern in this comparison:</span>
                <span className="text-lg sm:text-xl font-extrabold capitalize text-[#1677FF] break-words">{betterChoice}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
