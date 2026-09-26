"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeOCR, getErrorMessage } from '../services/api';
import { useUserStore } from '../store/userStore';
import { Loader2, ImagePlus } from 'lucide-react';

export default function OCRUploader() {
  const router = useRouter();
  const { conditions, setResult, setLoading, isLoading, setDishName } = useUserStore();
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

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
        setLoading(true);
        setError("");
        setDishName("Label Scan");
        const res = await analyzeOCR(base64, conditions);
        setResult(res);
        router.push("/result");
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to analyze image"));
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <div className="text-red-600 mb-2 text-sm bg-red-50 p-4 rounded-2xl border border-red-100" role="alert">{error}</div>}
      
      {!preview ? (
        <label className="border-2 border-dashed border-[#E5E8EC] bg-[#F9FBFF] rounded-[24px] p-8 sm:p-10 flex flex-col items-center justify-center cursor-pointer hover:border-[#1677FF] hover:bg-[#EAF3FF] focus-within:border-[#1677FF] focus-within:ring-2 focus-within:ring-[#EAF3FF] transition-all group">
          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-[#1677FF] mb-4 group-hover:scale-110 transition-transform">
            <ImagePlus size={28} />
          </div>
          <span className="font-bold text-[#15171A] text-lg text-center">Scan a Food Label</span>
          <span className="text-sm text-[#69707A] mt-2 text-center max-w-[280px]">Capture the ingredient list for a personalized risk summary.</span>
          <input type="file" className="sr-only" accept="image/jpeg, image/png, image/webp" onChange={handleFile} disabled={isLoading || conditions.length === 0} />
        </label>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative h-64 w-full rounded-[24px] overflow-hidden border border-[#E5E8EC] shadow-sm">
            <img src={preview} alt="Upload preview" className="object-contain w-full h-full bg-[#F4F5F7]" />
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-[#1677FF] mb-4" size={32} />
                <span className="text-[#15171A] font-bold text-lg">Extracting Ingredients...</span>
                <span className="text-[#69707A] text-sm mt-1 text-center px-4">Analyzing against your profile</span>
              </div>
            )}
          </div>
          <label className="w-full py-3 bg-white border-2 border-[#E5E8EC] rounded-2xl font-bold text-[#15171A] hover:bg-[#F4F5F7] hover:border-[#1677FF] transition-all text-center text-sm cursor-pointer focus-within:border-[#1677FF]">
            {isLoading ? "Analyzing..." : "Choose a different image"}
            <input type="file" className="sr-only" accept="image/jpeg, image/png, image/webp" onChange={handleFile} disabled={isLoading} />
          </label>
        </div>
      )}
    </div>
  );
}
