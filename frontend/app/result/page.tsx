"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../../store/userStore';
import { useTrackerStore } from '../../store/trackerStore';
import RiskCard from '../../components/RiskCard';
import { ArrowLeft, Check, Plus, Clock, RotateCcw } from 'lucide-react';

export default function ResultPage() {
  const router = useRouter();
  const { currentAnalysis, result, dishName } = useUserStore();
  const { addMeal } = useTrackerStore();
  const [added, setAdded] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>("Lunch");

  const effectiveResult = currentAnalysis || result;

  useEffect(() => {
    if (!effectiveResult) {
      router.push("/");
    }
  }, [effectiveResult, router]);

  if (!effectiveResult) return null;

  const handleAddLog = () => {
    const estimatedSodium = effectiveResult.nutrition?.sodium_mg ?? (
      effectiveResult.risk_level === 'high' ? 800 :
      effectiveResult.risk_level === 'moderate' ? 400 : 200
    );

    const estimatedCarbs = effectiveResult.nutrition?.carbs_g ?? 0;

    addMeal({
      name: effectiveResult.food_name || dishName || "Food Analysis",
      sodium_mg: estimatedSodium,
      carbs_g: estimatedCarbs,
      risk_level: effectiveResult.risk_level,
      timestamp: new Date().toISOString()
    });
    setAdded(true);
  };

  return (
    <div className="pb-16 animate-in fade-in duration-500">
      
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-[#69707A] hover:text-[#1677FF] transition-colors font-semibold text-sm bg-white px-4 py-2.5 rounded-full border border-[#E5E8EC] shadow-sm"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Analyze Another Food</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push("/history")}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-[#E5E8EC] text-xs font-bold text-[#69707A] hover:border-[#1677FF] hover:text-[#1677FF] transition-colors shadow-sm"
          >
            <Clock size={15} />
            <span>History</span>
          </button>

          <button 
            onClick={handleAddLog}
            disabled={added}
            className={`flex items-center gap-2 font-bold px-5 py-2.5 rounded-full transition-all shadow-sm text-sm ${
              added 
                ? "bg-[#F6FFED] text-[#52C41A] border border-[#52C41A]/30" 
                : "bg-[#1677FF] text-white hover:bg-blue-600"
            }`}
          >
            {added ? (
              <>
                <Check size={16} aria-hidden="true" />
                <span>Added to Daily Log</span>
              </>
            ) : (
              <>
                <Plus size={16} aria-hidden="true" />
                <span>Add to Daily Log</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Analysis Result */}
      <RiskCard
        result={effectiveResult}
        dishName={effectiveResult.food_name || dishName || "Food Analysis"}
      />
    </div>
  );
}
