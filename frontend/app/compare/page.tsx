"use client";

import { useState } from 'react';
import { searchDishes, analyzeDish } from '../../services/api';
import { useUserStore } from '../../store/userStore';
import { Dish, RiskResult } from '../../types';

export default function ComparePage() {
  const { conditions } = useUserStore();
  const [dish1, setDish1] = useState("");
  const [dish2, setDish2] = useState("");
  const [res1, setRes1] = useState<RiskResult | null>(null);
  const [res2, setRes2] = useState<RiskResult | null>(null);
  const [d1Data, setD1Data] = useState<Dish | null>(null);
  const [d2Data, setD2Data] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleCompare = async () => {
    if (!dish1 || !dish2 || conditions.length === 0) return;
    setLoading(true);
    try {
      const dbRes1 = await searchDishes(dish1);
      const dbRes2 = await searchDishes(dish2);
      
      if (dbRes1.length > 0 && dbRes2.length > 0) {
        setD1Data(dbRes1[0]);
        setD2Data(dbRes2[0]);
        
        const r1 = await analyzeDish(dbRes1[0].name, conditions);
        const r2 = await analyzeDish(dbRes2[0].name, conditions);
        
        setRes1(r1);
        setRes2(r2);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const scoreMap = { "low": 1, "moderate": 2, "high": 3 };
  
  let betterChoice = "";
  if (res1 && res2 && d1Data && d2Data) {
    const s1 = scoreMap[res1.risk_level];
    const s2 = scoreMap[res2.risk_level];
    if (s1 < s2) betterChoice = d1Data.name;
    else if (s2 < s1) betterChoice = d2Data.name;
    else {
      // tie breaker on sodium
      if (d1Data.sodium_mg < d2Data.sodium_mg) betterChoice = d1Data.name;
      else betterChoice = d2Data.name;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-extrabold text-gray-900">Compare Dishes</h1>
          <p className="text-gray-500 mt-2">See which dish is safer for your conditions.</p>
        </header>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dish 1</label>
            <input type="text" value={dish1} onChange={(e) => setDish1(e.target.value)} placeholder="e.g. pav bhaji" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <div className="font-bold text-gray-400 pb-2 hidden md:block">VS</div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dish 2</label>
            <input type="text" value={dish2} onChange={(e) => setDish2(e.target.value)} placeholder="e.g. idli sambar" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
          </div>
          <button onClick={handleCompare} disabled={loading || !dish1 || !dish2 || conditions.length===0} className="w-full md:w-auto px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50">
            {loading ? "Comparing..." : "Compare"}
          </button>
        </div>
        
        {conditions.length === 0 && <p className="text-red-500">Please select conditions on the home page first.</p>}

        {res1 && res2 && d1Data && d2Data && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-bold text-gray-700">Factor</th>
                  <th className="p-4 font-bold text-gray-900 capitalize text-lg">{d1Data.name}</th>
                  <th className="p-4 font-bold text-gray-900 capitalize text-lg">{d2Data.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-4 font-medium text-gray-500">Risk Level</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${res1.risk_level === 'high' ? 'bg-red-100 text-red-700' : res1.risk_level === 'moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {res1.risk_level.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${res2.risk_level === 'high' ? 'bg-red-100 text-red-700' : res2.risk_level === 'moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {res2.risk_level.toUpperCase()}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-gray-500">Sodium</td>
                  <td className="p-4 font-medium">{d1Data.sodium_mg}mg</td>
                  <td className="p-4 font-medium">{d2Data.sodium_mg}mg</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-gray-500">Carbs</td>
                  <td className="p-4 font-medium">{d1Data.carbs_g}g</td>
                  <td className="p-4 font-medium">{d2Data.carbs_g}g</td>
                </tr>
                {conditions.map(c => {
                  const r1_flags = res1.flags.filter(f => f.condition === c).length;
                  const r2_flags = res2.flags.filter(f => f.condition === c).length;
                  return (
                    <tr key={c}>
                      <td className="p-4 font-medium text-gray-500 capitalize">For {c}</td>
                      <td className="p-4">{r1_flags > 0 ? '❌ Avoid' : '✅ Safe'}</td>
                      <td className="p-4">{r2_flags > 0 ? '❌ Avoid' : '✅ Safe'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            <div className="p-6 bg-slate-50 border-t border-gray-100 text-center">
              <span className="text-gray-500 mr-2">Better choice:</span>
              <span className="text-xl font-bold capitalize text-green-700">{betterChoice}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
