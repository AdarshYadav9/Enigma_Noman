"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeOCR } from '../services/api';
import { useUserStore } from '../store/userStore';
import { Upload } from 'lucide-react';

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
      } catch (err: any) {
        setError(err.message || "Failed to analyze image");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <div className="text-red-500 mb-2 text-sm bg-red-50 p-2 rounded">{error}</div>}
      <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
        <Upload className="text-gray-400 mb-2" size={32} />
        <span className="font-medium text-gray-700">Click or Drag label image here</span>
        <span className="text-sm text-gray-500 mt-1">Accepts JPG, PNG, WEBP</span>
        <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleFile} disabled={isLoading || conditions.length === 0} />
      </label>
      
      {preview && (
        <div className="relative h-48 w-full rounded-xl overflow-hidden border border-gray-200">
          <img src={preview} alt="Upload preview" className="object-contain w-full h-full" />
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full animate-pulse">Extracting ingredients...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
