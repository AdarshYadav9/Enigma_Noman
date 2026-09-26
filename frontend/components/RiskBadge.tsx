import { AlertTriangle, CheckCircle2, Info, HelpCircle } from 'lucide-react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  risk_level?: RiskLevel | string;
  level?: RiskLevel | string;
  className?: string;
}

export default function RiskBadge({ risk_level, level, className = "" }: RiskBadgeProps) {
  const currentLevel = (level || risk_level || "unknown").toLowerCase();

  if (currentLevel === "high") {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF1F0] border border-[#FF4D4F]/30 text-[#FF4D4F] text-xs font-extrabold uppercase tracking-wide ${className}`}>
        <AlertTriangle size={14} />
        High Concern
      </div>
    );
  }

  if (currentLevel === "moderate") {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFBE6] border border-[#FAAD14]/30 text-[#FAAD14] text-xs font-extrabold uppercase tracking-wide ${className}`}>
        <Info size={14} />
        Moderate Concern
      </div>
    );
  }

  if (currentLevel === "low") {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F6FFED] border border-[#52C41A]/30 text-[#52C41A] text-xs font-extrabold uppercase tracking-wide ${className}`}>
        <CheckCircle2 size={14} />
        Low Concern
      </div>
    );
  }

  // Unknown state - never display "Safe"
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F5F7] border border-[#E5E8EC] text-[#69707A] text-xs font-bold uppercase tracking-wide ${className}`}>
      <HelpCircle size={14} />
      Unknown / Insufficient Data
    </div>
  );
}
