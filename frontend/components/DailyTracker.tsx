"use client";

import { useTrackerStore } from '../store/trackerStore';
import RiskBadge from './RiskBadge';

export default function DailyTracker() {
  const { meals } = useTrackerStore();
  
  const dailySodiumLimit = 1500;
  const totalSodium = meals.reduce((sum, meal) => sum + meal.sodium_mg, 0);
  const sodiumPercent = Math.min(100, Math.round((totalSodium / dailySodiumLimit) * 100));
  
  const highRiskCount = meals.filter(m => m.risk_level === 'high').length;

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4">Daily Summary</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm font-medium mb-1">
              <span>Sodium Intake</span>
              <span>{totalSodium} mg / {dailySodiumLimit} mg</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${sodiumPercent > 85 ? 'bg-red-600' : sodiumPercent > 50 ? 'bg-yellow-400' : 'bg-green-500'}`} 
                style={{ width: `${sodiumPercent}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-2 text-sm font-medium">
            {highRiskCount > 0 && <p className="text-red-600">You've had {highRiskCount} HIGH RISK meals today.</p>}
            {sodiumPercent > 80 && <p className="text-orange-600">Sodium at {sodiumPercent}% of daily limit — stop adding salt.</p>}
            {highRiskCount === 0 && sodiumPercent < 80 && <p className="text-green-600">You're doing great today!</p>}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4">Meal Log</h2>
        {meals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No meals logged today yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {meals.map(meal => (
              <div key={meal.id} className="flex justify-between items-center p-4 border rounded-xl hover:bg-gray-50">
                <div>
                  <h3 className="font-bold capitalize">{meal.name}</h3>
                  <p className="text-sm text-gray-500">{new Date(meal.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {meal.sodium_mg}mg sodium</p>
                </div>
                <div className="scale-75 origin-right">
                  <RiskBadge risk_level={meal.risk_level as any} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
