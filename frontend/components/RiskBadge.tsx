import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export default function RiskBadge({ risk_level }: { risk_level: "high" | "moderate" | "low" }) {
  if (risk_level === "high") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF1F0] border border-[#FF4D4F]/20 text-[#FF4D4F] text-xs font-bold uppercase tracking-wide">
        <AlertTriangle size={14} />
        Higher Concern
      </div>
    );
  }
  if (risk_level === "moderate") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFBE6] border border-[#FAAD14]/20 text-[#FAAD14] text-xs font-bold uppercase tracking-wide">
        <Info size={14} />
        Moderate Concern
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F6FFED] border border-[#52C41A]/20 text-[#52C41A] text-xs font-bold uppercase tracking-wide">
      <CheckCircle2 size={14} />
      Lower Concern
    </div>
  );
}
