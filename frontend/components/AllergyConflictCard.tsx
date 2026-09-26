import { AllergyConflict } from '../types';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface AllergyConflictCardProps {
  conflicts: AllergyConflict[];
}

export default function AllergyConflictCard({ conflicts }: AllergyConflictCardProps) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="bg-[#FFF1F0] border-2 border-[#FF4D4F] rounded-2xl p-6 shadow-sm animate-in fade-in">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#FF4D4F] text-white flex items-center justify-center shrink-0 shadow-md">
          <ShieldAlert size={26} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-[#CF1322] uppercase tracking-wide">
              Allergy Conflict Detected
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-[#FF4D4F] text-white text-[11px] font-bold">
              CRITICAL
            </span>
          </div>

          <p className="text-sm text-[#820014] mt-1">
            This food item contains ingredients that directly conflict with your recorded health profile allergies:
          </p>

          <div className="mt-4 space-y-2">
            {conflicts.map((conflict, idx) => (
              <div
                key={idx}
                className="bg-white/80 rounded-xl p-3 border border-[#FF4D4F]/30 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-[#820014] block">Your Allergen:</span>
                  <span className="text-sm font-extrabold text-[#CF1322] capitalize">
                    {conflict.allergen}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[#CF1322] text-xs font-bold">
                  <span>Matched:</span>
                  <span className="bg-[#FFF1F0] px-2.5 py-1 rounded-lg border border-[#FF4D4F]/30 capitalize">
                    {conflict.matched_ingredient}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-[#820014] mt-3 italic">
            Do not consume if you have severe or anaphylactic sensitivity to these ingredients.
          </p>
        </div>
      </div>
    </div>
  );
}
