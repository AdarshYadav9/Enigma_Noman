"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../../store/userStore';
import { useTrackerStore } from '../../store/trackerStore';
import RiskCard from '../../components/RiskCard';

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
    addMeal({
      name: dishName || "Custom Analysis",
      sodium_mg: result.sodium_warning ? 1500 : 300, // heuristic if missing
      carbs_g: 0,
      risk_level: result.risk_level,
      timestamp: new Date().toISOString()
    });
    setAdded(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        
        <button 
          onClick={() => router.push("/")}
          className="self-start flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium"
        >
          <span>←</span> Analyze Another Food
        </button>

        <RiskCard result={result} dishName={dishName || "Custom Analysis"} />

        <button 
          onClick={handleAddLog}
          disabled={added}
          className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow hover:bg-slate-800 disabled:opacity-50 disabled:bg-green-600 transition-colors"
        >
          {added ? "✅ Added to Today's Log" : "➕ Add to Today's Log"}
        </button>

        <p className="text-center text-sm text-gray-400 mt-4 max-w-md mx-auto">
          This is a decision-support tool, not medical advice. 
          Always consult your doctor before making dietary changes.
        </p>
      </div>
    </div>
  );
}
