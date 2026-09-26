import { FoodInputMode } from '../types';
import { Mic, Keyboard, Camera, Barcode, FileText } from 'lucide-react';

interface InputModeBadgeProps {
  mode?: FoodInputMode | string;
  size?: "sm" | "md";
  className?: string;
}

export default function InputModeBadge({ 
  mode = "text", 
  size = "md",
  className = "" 
}: InputModeBadgeProps) {
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  const iconSize = size === "sm" ? 11 : 13;

  if (mode === "voice") {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#F9F0FF] text-[#722ED1] border border-[#722ED1]/20 font-semibold ${pad} ${className}`}>
        <Mic size={iconSize} aria-hidden="true" />
        Voice Input
      </span>
    );
  }

  if (mode === "barcode") {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#E6FFFB] text-[#13C2C2] border border-[#13C2C2]/20 font-semibold ${pad} ${className}`}>
        <Barcode size={iconSize} aria-hidden="true" />
        Barcode Scan
      </span>
    );
  }

  if (mode === "image" || mode === "ocr") {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#E6F4FF] text-[#1677FF] border border-[#1677FF]/20 font-semibold ${pad} ${className}`}>
        <Camera size={iconSize} aria-hidden="true" />
        Label OCR
      </span>
    );
  }

  if (mode === "menu") {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#FFF7E6] text-[#FA8C16] border border-[#FA8C16]/20 font-semibold ${pad} ${className}`}>
        <FileText size={iconSize} aria-hidden="true" />
        Menu OCR
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#F4F5F7] text-[#69707A] border border-[#E5E8EC] font-semibold ${pad} ${className}`}>
      <Keyboard size={iconSize} aria-hidden="true" />
      Text Input
    </span>
  );
}
