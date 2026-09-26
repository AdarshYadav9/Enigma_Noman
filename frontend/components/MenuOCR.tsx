"use client";

import { useState } from 'react';
import { analyzeMenu } from '../services/api';
import { useUserStore } from '../store/userStore';
import { Upload, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function MenuOCR() {
  const { conditions } = useUserStore();
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [menuResult, setMenuResult] = useState<any>(null);

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
      } catch (err: any) {
        setError(err.message || "Failed to analyze menu");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <div className="text-red-500 mb-2 text-sm bg-red-50 p-2 rounded">{error}</div>}
      
      {!menuResult ? (
        <>
          <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
            <Upload className="text-gray-400 mb-2" size={32} />
            <span className="font-medium text-gray-700">Upload restaurant menu photo</span>
            <span className="text-sm text-gray-500 mt-1">Accepts JPG, PNG, WEBP</span>
            <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleFile} disabled={isLoading || conditions.length === 0} />
          </label>
          
          {preview && (
            <div className="relative h-48 w-full rounded-xl overflow-hidden border border-gray-200">
              <img src={preview} alt="Upload preview" className="object-contain w-full h-full" />
              {isLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full animate-pulse">Scanning menu items...</span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <h3 className="font-bold text-green-800 flex items-center gap-2 mb-2"><CheckCircle2 /> Safest Option</h3>
            <p className="text-lg capitalize font-medium">{menuResult.safest_dish || "None found"}</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <h3 className="font-bold text-red-800 flex items-center gap-2 mb-2"><AlertTriangle /> Avoid these</h3>
            <div className="flex flex-wrap gap-2">
              {menuResult.avoid_dishes.length > 0 ? menuResult.avoid_dishes.map((d: string) => (
                <span key={d} className="px-2 py-1 bg-white rounded border text-red-700 capitalize text-sm font-medium">{d}</span>
              )) : <span className="text-gray-600">None</span>}
            </div>
          </div>
          
          <h4 className="font-bold mt-4">All Items Found:</h4>
          <div className="space-y-2">
            {menuResult.dishes_found.map((dish: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
                <span className="capitalize font-medium">{dish.name}</span>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${dish.risk_level === 'high' ? 'bg-red-100 text-red-700' : dish.risk_level === 'moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  {dish.risk_level}
                </span>
              </div>
            ))}
          </div>
          
          <button onClick={() => setMenuResult(null)} className="w-full mt-4 py-2 border rounded-lg font-medium hover:bg-gray-50">Scan Another Menu</button>
        </div>
      )}
    </div>
  );
}
