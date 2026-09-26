"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeFood, analyzeBarcode, getErrorMessage } from '../services/api';
import { useUserStore } from '../store/userStore';
import { Barcode, Loader2, Camera, AlertCircle, ArrowRight } from 'lucide-react';

interface BarcodeInputProps {
  onSwitchToOCR?: () => void;
}

export default function BarcodeInput({ onSwitchToOCR }: BarcodeInputProps) {
  const router = useRouter();
  const { conditions, setResult, setCurrentAnalysis, setLoading, isLoading, setDishName } = useUserStore();
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [isNotFound, setIsNotFound] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      setLoading(true);
      setError("");
      setIsNotFound(false);
      setDishName("Packaged Product");

      let res;
      try {
        // First try personalized food analysis with barcode
        res = await analyzeFood({
          food_name: "Packaged Product",
          barcode: barcode.trim(),
          food_source: "packaged",
          input_mode: "barcode"
        });
      } catch (authOrUnifiedErr: any) {
        // Fallback to legacy barcode analysis if conditions available
        if (conditions && conditions.length > 0) {
          res = await analyzeBarcode(barcode.trim(), conditions);
        } else {
          throw authOrUnifiedErr;
        }
      }

      if (res.status === "not_found" || res.status === "unknown" || (res.risk_level === "unknown" && (!res.flags || res.flags.length === 0) && !res.nutrition)) {
        setIsNotFound(true);
        setError("Product not found. You can upload the package label for OCR analysis.");
        return;
      }

      setResult(res);
      setCurrentAnalysis(res);
      router.push("/result");
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Product not found. You can upload the package label for OCR analysis.");
      setError(msg);
      if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("no product")) {
        setIsNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-4 rounded-2xl border border-red-100 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
          {isNotFound && onSwitchToOCR && (
            <button
              type="button"
              onClick={onSwitchToOCR}
              className="mt-2 text-xs font-bold text-[#1677FF] hover:underline flex items-center gap-1 self-start"
            >
              Switch to Upload Label (OCR) <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      <div className="bg-[#F4F5F7] rounded-2xl p-6 border border-[#E5E8EC] flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-[#1677FF]">
          <Barcode size={32} />
        </div>
        <div>
          <h3 className="font-bold text-[#15171A]">Check a Packaged Product</h3>
          <p className="text-sm text-[#69707A] mt-1 max-w-[280px]">
            Scan or enter the barcode number to retrieve official product data and verify dietary risks.
          </p>
        </div>

        {/* Camera Scanner Simulation / Toggle */}
        <div className="w-full max-w-sm flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setIsCameraActive(!isCameraActive)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isCameraActive 
                ? "bg-[#1677FF] text-white" 
                : "bg-white border border-[#E5E8EC] text-[#69707A] hover:text-[#15171A]"
            }`}
          >
            <Camera size={14} />
            {isCameraActive ? "Close Camera View" : "Scan with Camera"}
          </button>
        </div>

        {isCameraActive && (
          <div className="w-full max-w-sm p-4 bg-black/5 rounded-2xl border border-dashed border-[#1677FF] flex flex-col items-center justify-center py-8 relative">
            <div className="w-48 h-24 border-2 border-[#1677FF] rounded-lg animate-pulse flex items-center justify-center">
              <span className="text-xs font-bold text-[#1677FF]">Position Barcode Here</span>
            </div>
            <p className="text-xs text-[#69707A] mt-3">Camera detection ready. (Or enter numbers below)</p>
          </div>
        )}

        <input
          type="text"
          placeholder="e.g. 8901491500702"
          value={barcode}
          onChange={(e) => {
            setBarcode(e.target.value);
            setError("");
            setIsNotFound(false);
          }}
          className="w-full max-w-[320px] p-4 border border-[#E5E8EC] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EAF3FF] focus:border-[#1677FF] text-center text-lg font-mono tracking-wider bg-white shadow-sm"
        />
      </div>

      <button 
        type="submit"
        disabled={isLoading || !barcode.trim()}
        className="w-full bg-[#1677FF] text-white font-bold py-4 rounded-2xl shadow-[0_4px_14px_rgba(22,119,255,0.3)] hover:bg-[#155ACC] disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
      >
        {isLoading ? <><Loader2 className="animate-spin" size={18} /> Retrieving Product Info...</> : "Analyze Barcode"}
      </button>
    </form>
  );
}
