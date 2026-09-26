"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { searchDishes, analyzeDish, analyzeIngredients, getErrorMessage } from '../services/api';
import { useUserStore } from '../store/userStore';
import { Dish } from '../types';
import OCRUploader from './OCRUploader';
import MenuOCR from './MenuOCR';
import BarcodeInput from './BarcodeInput';
import { Search, PenLine, ScanLine, Utensils, Barcode, ChevronRight, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type TabId = "search" | "manual" | "ocr" | "menu" | "barcode";

export default function DishSearch() {
  const router = useRouter();
  const { conditions, setResult, setLoading, isLoading, setDishName } = useUserStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Dish[]>([]);
  const [tab, setTab] = useState<TabId>("search");
  const [manualIngredients, setManualIngredients] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 1) {
        searchDishes(query).then(setResults).catch((e: unknown) => setError(getErrorMessage(e, "Search failed")));
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to analyze dish"));
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to analyze ingredients"));
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
    { id: "search", label: "Search", icon: Search },
    { id: "manual", label: "Manual", icon: PenLine },
    { id: "ocr", label: "Scan Label", icon: ScanLine },
    { id: "menu", label: "Menu", icon: Utensils },
    { id: "barcode", label: "Barcode", icon: Barcode }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#F4F5F7] p-1.5 rounded-[20px] flex overflow-x-auto scrollbar-hide border border-[#E5E8EC]">
        {tabs.map(t => {
          const isActive = tab === t.id;
          return (
            <button 
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[16px] font-medium text-sm transition-all whitespace-nowrap ${
                isActive 
                  ? "bg-white text-[#1677FF] shadow-sm" 
                  : "text-[#69707A] hover:text-[#15171A] hover:bg-white/50"
              }`}
            >
              <t.icon size={16} className={isActive ? "text-[#1677FF]" : "text-[#69707A]"} />
              {t.label}
            </button>
          )
        })}
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-100 p-4 rounded-2xl text-sm flex items-start gap-2">
          {error}
        </div>
      )}

      <div className="min-h-[280px]">
        {tab === "search" && (
          <div className="relative flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#69707A]" size={20} />
              <input
                type="text"
                placeholder="Search Indian dishes (e.g. pav bhaji, paneer tikka)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-white border border-[#E5E8EC] rounded-2xl py-4 pl-12 pr-4 text-[#15171A] focus:outline-none focus:ring-2 focus:ring-[#EAF3FF] focus:border-[#1677FF] shadow-sm transition-all text-[15px]"
              />
            </div>
            
            {isLoading && (
              <div className="flex items-center justify-center p-8 text-[#1677FF]">
                <Loader2 className="animate-spin" size={24} />
              </div>
            )}
            
            {!isLoading && results.length > 0 && (
              <div className="flex flex-col gap-2">
                {results.map(dish => (
                  <button
                    key={dish.name}
                    onClick={() => handleSelectDish(dish.name)}
                    className="flex items-center justify-between p-4 rounded-2xl border border-[#E5E8EC] hover:border-[#1677FF] hover:bg-[#F9FBFF] transition-all text-left bg-white group"
                  >
                    <div>
                      <span className="font-bold text-[#15171A] capitalize block">{dish.name}</span>
                      <span className="text-xs text-[#69707A]">Indian Dish • Contains {dish.sodium_mg}mg Sodium</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#F4F5F7] group-hover:bg-[#1677FF] group-hover:text-white flex items-center justify-center text-[#69707A] transition-colors">
                      <ChevronRight size={16} />
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {!isLoading && query.length > 1 && results.length === 0 && (
              <div className="p-8 text-center text-[#69707A]">
                No dishes found matching &ldquo;{query}&rdquo;.
              </div>
            )}
          </div>
        )}
        
        {tab === "manual" && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#F4F5F7] rounded-2xl p-4 border border-[#E5E8EC]">
              <textarea
                placeholder="Enter ingredients separated by commas (e.g. maida, salt, butter, sugar...)"
                value={manualIngredients}
                onChange={(e) => setManualIngredients(e.target.value)}
                className="w-full bg-transparent border-none resize-none h-32 focus:outline-none text-[#15171A] text-[15px] placeholder:text-[#69707A]"
              />
            </div>
            <button 
              onClick={handleManualAnalyze}
              disabled={isLoading || conditions.length === 0 || !manualIngredients.trim()}
              className="w-full bg-[#1677FF] text-white font-bold py-4 rounded-2xl shadow-[0_4px_14px_rgba(22,119,255,0.3)] hover:bg-[#155ACC] disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
            >
              {isLoading ? <><Loader2 className="animate-spin" size={18} /> Analyzing...</> : "Analyze Ingredients"}
            </button>
          </div>
        )}

        {tab === "ocr" && <OCRUploader />}
        {tab === "menu" && <MenuOCR />}
        {tab === "barcode" && <BarcodeInput />}
      </div>
    </div>
  );
}
