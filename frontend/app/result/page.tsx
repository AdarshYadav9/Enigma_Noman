"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../../store/userStore';
import RiskCard from '../../components/RiskCard';

export default function ResultPage() {
  const router = useRouter();
  const { result, dishName } = useUserStore();

  useEffect(() => {
    if (!result) {
      router.push("/");
    }
  }, [result, router]);

  if (!result) return null;

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

        <p className="text-center text-sm text-gray-400 mt-8 max-w-md mx-auto">
          This is a decision-support tool, not medical advice. 
          Always consult your doctor before making dietary changes.
        </p>
      </div>
    </div>
  );
}
