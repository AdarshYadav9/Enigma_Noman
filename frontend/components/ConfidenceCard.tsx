import { ConfidenceResult } from '../types';
import { Gauge, Info } from 'lucide-react';

interface ConfidenceCardProps {
  confidence?: ConfidenceResult | null;
}

export default function ConfidenceCard({ confidence }: ConfidenceCardProps) {
  if (!confidence) return null;

  const foodIdPct = Math.round((confidence.food_identification ?? 0) * 100);
  const ingInfoPct = Math.round((confidence.ingredient_information ?? 0) * 100);
  const overallPct = Math.round((confidence.overall ?? 0) * 100);

  const getBarColor = (pct: number) => {
    if (pct >= 85) return "bg-[#52C41A]";
    if (pct >= 60) return "bg-[#FAAD14]";
    return "bg-[#1677FF]";
  };

  return (
    <section className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#E6F4FF] text-[#1677FF] flex items-center justify-center">
            <Gauge size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#15171A]">Analysis Confidence</h3>
            <p className="text-xs text-[#69707A]">Information completeness & recognition fidelity</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F4F5F7] rounded-full text-xs font-bold text-[#15171A]">
          Overall: {overallPct}%
        </div>
      </div>

      <div className="space-y-4">
        {/* Food Identification */}
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-[#69707A]">Food Identification</span>
            <span className="text-[#15171A] font-bold">{foodIdPct}%</span>
          </div>
          <div className="w-full bg-[#F4F5F7] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getBarColor(foodIdPct)}`}
              style={{ width: `${foodIdPct}%` }}
            />
          </div>
        </div>

        {/* Ingredient Information */}
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-[#69707A]">Ingredient Information</span>
            <span className="text-[#15171A] font-bold">{ingInfoPct}%</span>
          </div>
          <div className="w-full bg-[#F4F5F7] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getBarColor(ingInfoPct)}`}
              style={{ width: `${ingInfoPct}%` }}
            />
          </div>
        </div>

        {/* Overall Score */}
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span className="text-[#69707A]">Overall Information Score</span>
            <span className="text-[#15171A] font-bold">{overallPct}%</span>
          </div>
          <div className="w-full bg-[#F4F5F7] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getBarColor(overallPct)}`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tooltip Disclaimer */}
      <div className="mt-4 pt-4 border-t border-[#E5E8EC] flex items-start gap-2 text-xs text-[#69707A]">
        <Info size={14} className="shrink-0 mt-0.5 text-[#1677FF]" />
        <span>
          Confidence reflects how much reliable food knowledge and ingredient data was available. It is not a clinical medical probability.
        </span>
      </div>
    </section>
  );
}
