"use client";

import { useState } from 'react';
import { analyzeMenu, getErrorMessage } from '../services/api';
import { useUserStore } from '../store/userStore';
import { MenuAnalysis } from '../types';
import { ImagePlus, Loader2, Info, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function MenuOCR() {
  const { conditions } = useUserStore();
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [menuResult, setMenuResult] = useState<MenuAnalysis | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (conditions.length === 0) {
      setError("Please select at least one condition.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setPreview(base64);
      try {
        setIsLoading(true);
        setError("");
        const res = await analyzeMenu(base64, conditions);
        setMenuResult(res);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "We couldn't read the menu clearly. Please try a clearer photo."));
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const dishesFound = menuResult?.dishes_found ?? [];
  const avoidDishes = menuResult?.avoid_dishes ?? [];

  return (
    <div className="flex flex-col gap-4">
      {error && <div className="text-red-600 mb-2 text-sm bg-red-50 p-4 rounded-2xl border border-red-100" role="alert">{error}</div>}
      
      {!menuResult ? (
        <>
          <label className="border-2 border-dashed border-[#E5E8EC] bg-[#F9FBFF] rounded-[24px] p-8 sm:p-10 flex flex-col items-center justify-center cursor-pointer hover:border-[#1677FF] hover:bg-[#EAF3FF] focus-within:border-[#1677FF] focus-within:ring-2 focus-within:ring-[#EAF3FF] transition-all group">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-[#1677FF] mb-4 group-hover:scale-110 transition-transform">
              <ImagePlus size={28} />
            </div>
            <span className="font-bold text-[#15171A] text-lg text-center">Analyze a Restaurant Menu</span>
            <span className="text-sm text-[#69707A] mt-2 text-center max-w-[280px]">Scan a menu to identify dishes that may need closer attention based on your profile.</span>
            <input type="file" className="sr-only" accept="image/jpeg, image/png, image/webp" onChange={handleFile} disabled={isLoading || conditions.length === 0} />
          </label>
          
          {preview && (
            <div className="relative h-64 w-full rounded-[24px] overflow-hidden border border-[#E5E8EC] shadow-sm">
              <img src={preview} alt="Upload preview" className="object-contain w-full h-full bg-[#F4F5F7]" />
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center px-4">
                  <Loader2 className="animate-spin text-[#1677FF] mb-4" size={32} />
                  <span className="text-[#15171A] font-bold text-lg">Scanning Menu...</span>
                  <span className="text-[#69707A] text-sm mt-1 text-center">Matching against Indian dishes database</span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#EAF3FF] p-6 rounded-[24px] border border-[#1677FF]/20">
              <h3 className="text-sm font-bold text-[#1677FF] flex items-center gap-2 mb-2 uppercase tracking-wider">
                <CheckCircle2 size={16} /> Lower Concern
              </h3>
              <p className="text-2xl capitalize font-bold text-[#15171A] break-words">{menuResult.safest_dish || "None detected"}</p>
              <p className="text-xs text-[#69707A] mt-2">Based on this analysis.</p>
            </div>
            
            <div className="bg-[#FFF1F0] p-6 rounded-[24px] border border-[#FF4D4F]/20">
              <h3 className="text-sm font-bold text-[#FF4D4F] flex items-center gap-2 mb-3 uppercase tracking-wider">
                <AlertTriangle size={16} /> Requires Attention
              </h3>
              <div className="flex flex-wrap gap-2">
                {avoidDishes.length > 0 ? avoidDishes.map((d) => (
                  <span key={d} className="px-3 py-1.5 bg-white rounded-full border border-[#FF4D4F]/20 text-[#FF4D4F] capitalize text-sm font-bold shadow-sm">{d}</span>
                )) : <span className="text-[#69707A] text-sm font-medium">No major configured flags</span>}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-[#15171A] mb-3 text-lg flex items-center gap-2"><ShieldCheck size={20} className="text-[#1677FF]" /> Dishes Detected</h4>
            {dishesFound.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-white border border-dashed border-[#E5E8EC] rounded-2xl">
                <div className="w-14 h-14 bg-[#F4F5F7] rounded-full flex items-center justify-center text-[#69707A] mb-3">
                  <Info size={24} />
                </div>
                <p className="text-[#15171A] font-bold mb-1">No known dishes matched</p>
                <p className="text-[#69707A] text-sm max-w-sm">Try a clearer, straighter photo, or search individual dishes from the dashboard.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dishesFound.map((dish, i) => (
                  <div key={`${dish.name}-${i}`} className="flex justify-between items-center gap-3 p-4 bg-white border border-[#E5E8EC] rounded-2xl">
                    <div className="min-w-0">
                      <span className="capitalize font-bold text-[#15171A] block truncate">{dish.name}</span>
                      {dish.top_flag && (
                        <span className="text-xs text-[#69707A]">Flagged: <span className="capitalize">{dish.top_flag}</span></span>
                      )}
                    </div>
                    <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      dish.risk_level === 'high' ? 'bg-[#FFF1F0] text-[#FF4D4F]' : 
                      dish.risk_level === 'moderate' ? 'bg-[#FFFBE6] text-[#FAAD14]' : 
                      'bg-[#F6FFED] text-[#52C41A]'
                    }`}>
                      {dish.risk_level}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button onClick={() => { setMenuResult(null); setPreview(null); }} className="w-full py-4 bg-white border-2 border-[#E5E8EC] rounded-2xl font-bold text-[#15171A] hover:bg-[#F4F5F7] transition-all shadow-sm">
            Scan Another Menu
          </button>
        </div>
      )}
    </div>
  );
}
