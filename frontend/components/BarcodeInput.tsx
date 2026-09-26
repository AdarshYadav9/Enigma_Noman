"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeBarcode, getErrorMessage } from '../services/api';
import { useUserStore } from '../store/userStore';
import { Barcode, Loader2 } from 'lucide-react';

export default function BarcodeInput() {
  const router = useRouter();
  const { conditions, setResult, setLoading, isLoading, setDishName } = useUserStore();
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (conditions.length === 0) {
      setError("Please select at least one condition.");
      return;
    }
    if (!barcode.trim()) return;
    
    try {
      setLoading(true);
      setError("");
      setDishName("Packaged Product");
      const res = await analyzeBarcode(barcode.trim(), conditions);
      setResult(res);
      router.push("/result");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Product information not available."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="text-red-600 mb-2 text-sm bg-red-50 p-4 rounded-2xl border border-red-100">{error}</div>}
      
      <div className="bg-[#F4F5F7] rounded-2xl p-6 border border-[#E5E8EC] flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-[#1677FF]">
          <Barcode size={32} />
        </div>
        <div>
          <h3 className="font-bold text-[#15171A]">Check a Packaged Product</h3>
          <p className="text-sm text-[#69707A] mt-1 max-w-[250px]">Enter a barcode to retrieve available product information and analyze risks.</p>
        </div>
        
        <input
          type="text"
          placeholder="e.g. 8901491500702"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="w-full max-w-[300px] mt-4 p-4 border border-[#E5E8EC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EAF3FF] focus:border-[#1677FF] text-center text-lg tracking-wider"
        />
      </div>

      <button 
        type="submit"
        disabled={isLoading || conditions.length === 0 || !barcode.trim()}
        className="w-full bg-[#1677FF] text-white font-bold py-4 rounded-2xl shadow-[0_4px_14px_rgba(22,119,255,0.3)] hover:bg-[#155ACC] disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
      >
        {isLoading ? <><Loader2 className="animate-spin" size={18} /> Retrieving Info...</> : "Analyze Barcode"}
      </button>
    </form>
  );
}
