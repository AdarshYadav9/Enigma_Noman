import { AlertCircle, HelpCircle } from 'lucide-react';

interface UncertaintyCardProps {
  uncertainty?: string[];
  foodSource?: string;
}

export default function UncertaintyCard({ uncertainty = [], foodSource }: UncertaintyCardProps) {
  if (!uncertainty || uncertainty.length === 0) return null;

  return (
    <section className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#FAAD14]/30">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#FFFBE6] text-[#FAAD14] flex items-center justify-center">
          <HelpCircle size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#15171A]">Assessment Limitations & Uncertainty</h3>
          <p className="text-xs text-[#69707A]">
            {foodSource === "restaurant"
              ? "Restaurant preparation methods and quantities can vary"
              : "Factors that could not be fully confirmed"}
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {uncertainty.map((factor, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2.5 text-xs text-[#69707A] leading-relaxed p-2.5 rounded-xl bg-[#FFFBE6]/40 border border-[#FAAD14]/20"
          >
            <AlertCircle size={14} className="text-[#FAAD14] shrink-0 mt-0.5" />
            <span>{factor}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
