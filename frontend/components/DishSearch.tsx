"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { searchDishes, analyzeFood, analyzeDish, analyzeIngredients, getErrorMessage } from '../services/api';
import { useUserStore } from '../store/userStore';
import { Dish, FoodSource } from '../types';
import { Search, PenLine, ChevronRight, Loader2, Plus, X, AlertCircle } from 'lucide-react';

interface DishSearchProps {
  foodSource?: FoodSource;
  onSuccess?: () => void;
}

export default function DishSearch({ foodSource = "home", onSuccess }: DishSearchProps) {
  const router = useRouter();
  const { conditions, setResult, setCurrentAnalysis, setLoading, isLoading, setDishName } = useUserStore();
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Dish[]>([]);
  const [showManualIngredients, setShowManualIngredients] = useState(false);
  const [ingredientTag, setIngredientTag] = useState("");
  const [ingredientsList, setIngredientsList] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 1) {
        searchDishes(query.trim())
          .then(setResults)
          .catch((e: unknown) => setError(getErrorMessage(e, "Search failed")));
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleAddIngredient = () => {
    const trimmed = ingredientTag.trim();
    if (trimmed && !ingredientsList.includes(trimmed)) {
      setIngredientsList([...ingredientsList, trimmed]);
      setIngredientTag("");
    }
  };

  const handleRemoveIngredient = (ing: string) => {
    setIngredientsList(ingredientsList.filter(i => i !== ing));
  };

  const handleAnalyze = async (foodNameToAnalyze?: string) => {
    const name = (foodNameToAnalyze || query).trim();
    if (!name && ingredientsList.length === 0) {
      setError("Please enter a food name or ingredients.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const resolvedName = name || "Custom Dish";
      setDishName(resolvedName);

      let res;
      try {
        // Try unified personalized endpoint first
        res = await analyzeFood({
          food_name: resolvedName,
          food_source: foodSource,
          input_mode: "text",
          ingredients: ingredientsList.length > 0 ? ingredientsList : undefined
        });
      } catch (unifiedErr: any) {
        // Fallback to legacy endpoints if conditions available
        if (conditions && conditions.length > 0) {
          if (ingredientsList.length > 0) {
            res = await analyzeIngredients(ingredientsList, conditions);
          } else {
            res = await analyzeDish(resolvedName, conditions);
          }
        } else {
          throw unifiedErr;
        }
      }

      setResult(res);
      setCurrentAnalysis(res);
      if (onSuccess) onSuccess();
      router.push("/result");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to analyze food. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="text-red-600 bg-red-50 border border-red-100 p-4 rounded-2xl text-sm flex items-start gap-2" role="alert">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#69707A]" size={20} />
        <input
          type="text"
          placeholder={
            foodSource === "restaurant"
              ? "Search restaurant dishes (e.g. paneer tikka, dal makhani)..."
              : "Search or type food (e.g. poha, khichdi, dal chawal)..."
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAnalyze();
            }
          }}
          className="w-full bg-white border border-[#E5E8EC] rounded-2xl py-4 pl-12 pr-28 text-[#15171A] focus:outline-none focus:ring-2 focus:ring-[#EAF3FF] focus:border-[#1677FF] shadow-sm transition-all text-[15px]"
        />
        <button
          type="button"
          onClick={() => handleAnalyze()}
          disabled={isLoading || (!query.trim() && ingredientsList.length === 0)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#1677FF] text-white text-xs font-bold rounded-xl hover:bg-blue-600 disabled:opacity-40 transition-all flex items-center gap-1"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : "Analyze"}
        </button>
      </div>

      {/* Autocomplete Suggestions */}
      {isLoading && query.length > 1 && (
        <div className="flex items-center justify-center p-6 text-[#1677FF]">
          <Loader2 className="animate-spin" size={24} />
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {results.map((dish) => (
            <button
              key={dish.name}
              type="button"
              onClick={() => handleAnalyze(dish.name)}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E5E8EC] hover:border-[#1677FF] hover:bg-[#F9FBFF] transition-all text-left bg-white group"
            >
              <div>
                <span className="font-bold text-[#15171A] capitalize block text-sm">{dish.name}</span>
                <span className="text-xs text-[#69707A]">Indian Dish • ~{dish.sodium_mg || 300}mg Sodium</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-[#F4F5F7] group-hover:bg-[#1677FF] group-hover:text-white flex items-center justify-center text-[#69707A] transition-colors">
                <ChevronRight size={14} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Optional Custom Ingredients Section (Crucial for Home Food) */}
      <div className="border-t border-[#E5E8EC] pt-4">
        {!showManualIngredients ? (
          <button
            type="button"
            onClick={() => setShowManualIngredients(true)}
            className="text-xs font-bold text-[#1677FF] hover:underline flex items-center gap-1.5"
          >
            <PenLine size={14} /> + Add explicit ingredients (e.g. peanuts, mustard oil, ghee)
          </button>
        ) : (
          <div className="bg-[#F9FBFF] rounded-2xl p-4 border border-[#E5E8EC] space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#15171A]">Custom Recipe Ingredients</label>
              <button
                type="button"
                onClick={() => setShowManualIngredients(false)}
                className="text-xs text-[#69707A] hover:text-black"
              >
                Hide
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type an ingredient & press enter (e.g. peanuts)"
                value={ingredientTag}
                onChange={(e) => setIngredientTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddIngredient();
                  }
                }}
                className="flex-1 bg-white border border-[#E5E8EC] rounded-xl px-3 py-2 text-xs text-[#15171A] focus:outline-none focus:ring-1 focus:ring-[#1677FF]"
              />
              <button
                type="button"
                onClick={handleAddIngredient}
                className="px-3 py-2 bg-white border border-[#E5E8EC] text-xs font-bold rounded-xl text-[#15171A] hover:bg-gray-50 flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {ingredientsList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {ingredientsList.map((ing) => (
                  <span
                    key={ing}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E5E8EC] rounded-lg text-xs font-medium text-[#15171A] shadow-xs"
                  >
                    {ing}
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(ing)}
                      className="text-[#69707A] hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
