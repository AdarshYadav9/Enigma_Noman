"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { searchDishes, analyzeDish, analyzeIngredients } from '../services/api';
import { useUserStore } from '../store/userStore';
import { Dish } from '../types';

export default function DishSearch() {
  const router = useRouter();
  const { conditions, setResult, setLoading, isLoading, setDishName } = useUserStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Dish[]>([]);
  const [tab, setTab] = useState<"search" | "manual">("search");
  const [manualIngredients, setManualIngredients] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 1) {
        searchDishes(query).then(setResults).catch(e => setError(e.message));
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectDish = async (dishName: string) => {
    if (conditions.length === 0) {
      setError("Please select at least one condition.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setDishName(dishName);
      const res = await analyzeDish(dishName, conditions);
      setResult(res);
      router.push("/result");
    } catch (err: any) {
      setError(err.message || "Failed to analyze dish");
    } finally {
      setLoading(false);
    }
  };

  const handleManualAnalyze = async () => {
    if (conditions.length === 0) {
      setError("Please select at least one condition.");
      return;
    }
    const ingList = manualIngredients.split(",").map(s => s.trim()).filter(s => s);
    if (ingList.length === 0) return;
    
    try {
      setLoading(true);
      setError("");
      setDishName("Custom Ingredients");
      const res = await analyzeIngredients(ingList, conditions);
      setResult(res);
      router.push("/result");
    } catch (err: any) {
      setError(err.message || "Failed to analyze ingredients");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex gap-4 mb-4 border-b pb-2">
        <button 
          onClick={() => setTab("search")}
          className={`font-medium ${tab === "search" ? "text-red-600 border-b-2 border-red-600" : "text-gray-500"}`}
        >
          Search Dish
        </button>
        <button 
          onClick={() => setTab("manual")}
          className={`font-medium ${tab === "manual" ? "text-red-600 border-b-2 border-red-600" : "text-gray-500"}`}
        >
          Type ingredients manually
        </button>
      </div>

      {error && <div className="text-red-500 mb-4 text-sm bg-red-50 p-2 rounded">{error}</div>}

      {tab === "search" ? (
        <div className="relative">
          <input
            type="text"
            placeholder="What are you eating? (e.g. pav bhaji)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 mt-1 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {results.map(dish => (
                <button
                  key={dish.name}
                  onClick={() => handleSelectDish(dish.name)}
                  className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-0 capitalize"
                >
                  {dish.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <textarea
            placeholder="e.g. maida, sugar, potato, salt"
            value={manualIngredients}
            onChange={(e) => setManualIngredients(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button 
            onClick={handleManualAnalyze}
            disabled={isLoading || conditions.length === 0}
            className="bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      )}
      
      {isLoading && tab === "search" && <div className="mt-4 text-gray-500 text-sm">Loading...</div>}
    </div>
  );
}
