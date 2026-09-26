"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeOCR, getErrorMessage } from '../services/api';
import { useUserStore } from '../store/userStore';
import { Loader2, Camera, UploadCloud, X, AlertCircle } from 'lucide-react';

interface OCRUploaderProps {
  onSuccess?: () => void;
}

// Client-side image optimizer for fast OCR upload and optimal Tesseract resolution
function optimizeImageForOCR(file: File, maxDim = 2000, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new window.Image();
      img.onerror = () => resolve(dataUrl); // fallback to original if decode fails
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

export default function OCRUploader({ onSuccess }: OCRUploaderProps) {
  const router = useRouter();
  const { conditions, setResult, setCurrentAnalysis, setLoading, isLoading, setDishName } = useUserStore();
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [ocrStep, setOcrStep] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file (JPG, PNG, or WEBP).");
      return;
    }

    setFileName(file.name);
    setError("");

    try {
      setLoading(true);
      setDishName(file.name.replace(/\.[^/.]+$/, "") || "Food Label");
      
      setOcrStep("Optimizing image for reading...");
      const base64 = await optimizeImageForOCR(file);
      setPreview(base64);

      setOcrStep("Reading label with Tesseract OCR...");
      await new Promise(r => setTimeout(r, 600));

      setOcrStep("Extracting ingredients & nutrition...");
      const res = await analyzeOCR(base64, conditions.length > 0 ? conditions : ["Health Check"]);

      setOcrStep("Screening against your health profile...");
      await new Promise(r => setTimeout(r, 400));

      // Save result
      setResult(res);
      setCurrentAnalysis(res);
      if (onSuccess) onSuccess();
      router.push("/result");
    } catch (err: unknown) {
      console.error("OCR analysis error:", err);
      setError(getErrorMessage(err, "We couldn't read the ingredient text clearly. Try a sharper, well-lit photo."));
    } finally {
      setLoading(false);
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

  const clearSelection = () => {
    setPreview(null);
    setFileName(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-4 rounded-2xl border border-red-100 flex items-start gap-2" role="alert">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {!preview ? (
        <div className="space-y-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[24px] p-8 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging
                ? "border-[#1677FF] bg-[#EAF3FF] scale-[1.01]"
                : "border-[#E5E8EC] bg-[#F9FBFF] hover:border-[#1677FF] hover:bg-[#EAF3FF]/40"
            }`}
          >
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-[#1677FF] mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud size={30} />
            </div>
            <span className="font-bold text-[#15171A] text-lg text-center">Upload or Drag Food Label</span>
            <span className="text-sm text-[#69707A] mt-2 text-center max-w-[320px]">
              Take a photo of the ingredient list or nutrition facts table for instant risk analysis.
            </span>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#1677FF] bg-white px-3 py-1.5 rounded-full border border-[#E5E8EC] shadow-xs">
              <Camera size={14} /> JPG, PNG, or WEBP
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept="image/*"
              onChange={handleFileInput}
              disabled={isLoading}
            />
          </div>

          {/* Quick Snap with Camera for Mobile / Laptops */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isLoading}
              className="px-4 py-2 bg-white border border-[#E5E8EC] hover:border-[#1677FF] text-[#15171A] hover:text-[#1677FF] text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-xs"
            >
              <Camera size={15} />
              Take Photo with Camera
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              className="sr-only"
              accept="image/*"
              capture="environment"
              onChange={handleFileInput}
              disabled={isLoading}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative h-64 w-full rounded-[24px] overflow-hidden border border-[#E5E8EC] shadow-sm bg-[#F4F5F7]">
            <img src={preview} alt="Upload preview" className="object-contain w-full h-full" />
            
            {isLoading && (
              <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="animate-spin text-[#1677FF] mb-4" size={36} />
                <span className="text-[#15171A] font-bold text-lg">{ocrStep || "Processing..."}</span>
                <span className="text-[#69707A] text-xs mt-2 max-w-xs">
                  Running Tesseract OCR extraction and screening ingredients against your health profile.
                </span>
              </div>
            )}

            {!isLoading && (
              <button
                type="button"
                onClick={clearSelection}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-gray-700 hover:text-black flex items-center justify-center shadow-md"
                aria-label="Remove image"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-[#69707A] px-2">
            <span className="truncate max-w-[200px] font-mono">{fileName}</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="font-bold text-[#1677FF] hover:underline"
            >
              Choose different image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
