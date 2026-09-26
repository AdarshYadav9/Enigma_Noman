"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../../store/userStore';
import { useTrackerStore } from '../../store/trackerStore';
import RiskCard from '../../components/RiskCard';
import { ArrowLeft, Check, Plus } from 'lucide-react';

export default function ResultPage() {
  const router = useRouter();
  const { result, dishName } = useUserStore();
  const { addMeal } = useTrackerStore();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!result) {
      router.push("/");
    }
  }, [result, router]);

  if (!result) return null;

  const handleAddLog = () => {
    // Try to get actual sodium from the result if available
    // For dish analyses, we don't have sodium in the result currently
    // Use a reasonable default based on risk level
    const estimatedSodium = result.sodium_warning ? 1500 :
      result.risk_level === 'high' ? 800 :
      result.risk_level === 'moderate' ? 400 : 200;

    addMeal({
      name: dishName || "Custom Analysis",
      sodium_mg: estimatedSodium,
      carbs_g: 0,
      risk_level: result.risk_level,
      timestamp: new Date().toISOString()
    });
    setAdded(true);
  };

  return (
    <div className="pb-12 animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-[#69707A] hover:text-[#1677FF] transition-colors font-medium text-sm bg-white px-4 py-2 rounded-full border border-[#E5E8EC] shadow-sm"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to Analysis
        </button>

        <button 
          onClick={handleAddLog}
          disabled={added}
          className={`flex items-center gap-2 font-bold px-5 py-2.5 rounded-full transition-all shadow-sm text-sm ${
            added 
              ? "bg-[#F6FFED] text-[#52C41A] border border-[#52C41A]/20" 
              : "bg-[#15171A] text-white hover:bg-[#2A2E33]"
          }`}
        >
          {added ? <><Check size={16} aria-hidden="true" /> Added to Today&rsquo;s Log</> : <><Plus size={16} aria-hidden="true" /> Add to Log</>}
        </button>
      </div>

      <RiskCard result={result} dishName={dishName || "Custom Analysis"} />

    </div>
  );
}
