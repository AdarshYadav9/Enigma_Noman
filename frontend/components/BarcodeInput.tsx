"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeBarcode } from '../services/api';
import { useUserStore } from '../store/userStore';

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
      setDishName("Barcode Product");
      const res = await analyzeBarcode(barcode.trim(), conditions);
      setResult(res);
      router.push("/result");
    } catch (err: any) {
      setError(err.message || "Failed to analyze barcode");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && <div className="text-red-500 mb-2 text-sm bg-red-50 p-2 rounded">{error}</div>}
      <input
        type="text"
        placeholder="Enter barcode number (e.g. 8901491500702)"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
      />
      <button 
        type="submit"
        disabled={isLoading || conditions.length === 0 || !barcode.trim()}
        className="bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
      >
        {isLoading ? "Analyzing..." : "Analyze Barcode"}
      </button>
    </form>
  );
}
