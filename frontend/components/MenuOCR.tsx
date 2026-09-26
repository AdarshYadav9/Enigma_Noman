"use client";

import { useState, useRef } from 'react';
import { analyzeMenu, getErrorMessage } from '../services/api';
import { useUserStore } from '../store/userStore';
import { MenuAnalysis } from '../types';
import { 
  ImagePlus, 
  Loader2, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Camera, 
  Upload, 
  RefreshCw,
  UtensilsCrossed,
  Sparkles
} from 'lucide-react';

function optimizeImageForOCR(file: File, maxDim = 2200, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new window.Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
            return;
          }
        }
        resolve(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export default function MenuOCR() {
  const { conditions, profile } = useUserStore();
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ocrStep, setOcrStep] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [menuResult, setMenuResult] = useState<MenuAnalysis | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Derive active conditions: prefer profile conditions, then legacy conditions, fallback to General Health
  const activeConditions = (profile?.conditions && profile.conditions.length > 0)
    ? profile.conditions
    : (conditions && conditions.length > 0)
      ? conditions
      : ["General Health"];

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG, PNG, or WebP).");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      setOcrStep("Optimizing menu photo for high-accuracy OCR...");
      const base64 = await optimizeImageForOCR(file);
      setPreview(base64);

      setOcrStep("Scanning menu columns and text lines...");
      await new Promise(r => setTimeout(r, 400));

      setOcrStep("Matching restaurant dishes & evaluating dietary risks...");
      const res = await analyzeMenu(base64, activeConditions);
      setMenuResult(res);
    } catch (err: unknown) {
      console.error("Menu OCR error:", err);
      setError(getErrorMessage(err, "We couldn't read the menu clearly. Try a well-lit, direct photo of the menu text."));
    } finally {
      setIsLoading(false);
      setOcrStep("");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const resetScanner = () => {
    setMenuResult(null);
    setPreview(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const dishesFound = menuResult?.dishes_found ?? [];
  const avoidDishes = menuResult?.avoid_dishes ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Active Screening Context Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#F4F5F7] rounded-2xl border border-[#E5E8EC] text-xs">
        <span className="font-bold text-[#69707A] flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#1677FF]" /> Screening against:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {activeConditions.map((c, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-[#E5E8EC] font-semibold text-[#15171A] capitalize">
              {c}
            </span>
          ))}
          {profile?.allergies && profile.allergies.length > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-[#FFF1F0] border border-[#FF4D4F]/20 font-semibold text-[#FF4D4F] capitalize">
              {profile.allergies.length} Allergies
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-4 rounded-2xl border border-red-100 flex items-start gap-2" role="alert">
          <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {!menuResult ? (
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[24px] p-8 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging
                ? "border-[#1677FF] bg-[#EAF3FF] scale-[1.01]"
                : "border-[#E5E8EC] bg-[#F9FBFF] hover:border-[#1677FF] hover:bg-[#EAF3FF]"
            }`}
          >
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-[#1677FF] mb-4 group-hover:scale-110 transition-transform">
              <UtensilsCrossed size={28} />
            </div>
            <span className="font-bold text-[#15171A] text-lg text-center">Analyze a Restaurant Menu</span>
            <span className="text-sm text-[#69707A] mt-2 text-center max-w-sm">
              Scan or upload a printed or digital menu to detect dishes and highlight dietary alerts tailored to your health profile.
            </span>

            {/* Action Buttons inside Dropzone */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-full bg-[#1677FF] text-white hover:bg-blue-600 font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <Upload size={15} /> Upload Photo
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-full bg-white border border-[#E5E8EC] hover:border-[#1677FF] text-[#15171A] font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
              >
                <Camera size={15} className="text-[#1677FF]" /> Take Photo
              </button>
            </div>

            {/* Hidden Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileInput}
              disabled={isLoading}
            />
            <input
              ref={cameraInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleFileInput}
              disabled={isLoading}
            />
          </div>

          {/* Loading Preview Banner */}
          {isLoading && (
            <div className="p-6 bg-white rounded-2xl border border-[#E5E8EC] shadow-sm flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="animate-spin text-[#1677FF]" size={36} />
              <div>
                <p className="font-bold text-[#15171A] text-base">Reading Menu with OCR...</p>
                <p className="text-xs text-[#69707A] mt-1">{ocrStep || "Processing image and matching dishes..."}</p>
              </div>
            </div>
          )}

          {preview && !isLoading && (
            <div className="relative h-48 w-full rounded-[20px] overflow-hidden border border-[#E5E8EC] shadow-sm">
              <img src={preview} alt="Uploaded menu preview" className="object-contain w-full h-full bg-[#F4F5F7]" />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#EAF3FF] p-6 rounded-[24px] border border-[#1677FF]/20 shadow-xs">
              <h3 className="text-xs font-bold text-[#1677FF] flex items-center gap-2 mb-2 uppercase tracking-wider">
                <CheckCircle2 size={16} /> Safer Selection
              </h3>
              <p className="text-2xl capitalize font-extrabold text-[#15171A] break-words">
                {menuResult.safest_dish || "None detected"}
              </p>
              <p className="text-xs text-[#69707A] mt-2">
                Lowest conflict score detected on this scanned menu.
              </p>
            </div>

            <div className="bg-[#FFF1F0] p-6 rounded-[24px] border border-[#FF4D4F]/20 shadow-xs">
              <h3 className="text-xs font-bold text-[#FF4D4F] flex items-center gap-2 mb-3 uppercase tracking-wider">
                <AlertTriangle size={16} /> Requires Caution
              </h3>
              <div className="flex flex-wrap gap-2">
                {avoidDishes.length > 0 ? (
                  avoidDishes.map((d) => (
                    <span key={d} className="px-3 py-1 bg-white rounded-full border border-[#FF4D4F]/20 text-[#FF4D4F] capitalize text-xs font-bold shadow-xs">
                      {d}
                    </span>
                  ))
                ) : (
                  <span className="text-[#69707A] text-sm font-medium">No high risk dishes flagged</span>
                )}
              </div>
            </div>
          </div>

          {/* Dishes Detected List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-[#15171A] text-lg flex items-center gap-2">
                <ShieldCheck size={20} className="text-[#1677FF]" /> 
                Dishes Detected ({dishesFound.length})
              </h4>
            </div>

            {dishesFound.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-white border border-dashed border-[#E5E8EC] rounded-2xl">
                <div className="w-14 h-14 bg-[#F4F5F7] rounded-full flex items-center justify-center text-[#69707A] mb-3">
                  <Info size={24} />
                </div>
                <p className="text-[#15171A] font-bold mb-1">No known dishes matched</p>
                <p className="text-[#69707A] text-xs max-w-sm">
                  We scanned the image but couldn't identify specific dish names. Try a clearer, closer crop focusing on the dish title section.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {dishesFound.map((dish, i) => (
                  <div key={`${dish.name}-${i}`} className="flex justify-between items-center gap-3 p-4 bg-white border border-[#E5E8EC] rounded-2xl hover:border-gray-300 transition-colors shadow-xs">
                    <div className="min-w-0">
                      <span className="capitalize font-bold text-[#15171A] text-base block truncate">
                        {dish.name}
                      </span>
                      {dish.top_flag && (
                        <span className="text-xs text-[#69707A] block mt-0.5">
                          Flagged factor: <span className="font-semibold text-[#FF4D4F] capitalize">{dish.top_flag}</span>
                        </span>
                      )}
                    </div>
                    <span className={`shrink-0 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      dish.risk_level === 'high' ? 'bg-[#FFF1F0] text-[#FF4D4F] border border-[#FF4D4F]/20' : 
                      dish.risk_level === 'moderate' ? 'bg-[#FFFBE6] text-[#FAAD14] border border-[#FAAD14]/20' : 
                      'bg-[#F6FFED] text-[#52C41A] border border-[#52C41A]/20'
                    }`}>
                      {dish.risk_level}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action to scan another menu */}
          <button 
            type="button"
            onClick={resetScanner} 
            className="w-full py-4 bg-white border-2 border-[#E5E8EC] hover:border-[#1677FF] rounded-2xl font-bold text-[#15171A] hover:bg-[#F9FBFF] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} /> Scan Another Menu
          </button>
        </div>
      )}
    </div>
  );
}
