import { NutritionFlag } from '../types';
import { Activity, AlertTriangle } from 'lucide-react';

interface NutritionSummaryProps {
  nutrition?: Record<string, any>;
  nutritionFlags?: NutritionFlag[];
}

export default function NutritionSummary({ nutrition = {}, nutritionFlags = [] }: NutritionSummaryProps) {
  const hasNutrition = Object.keys(nutrition).length > 0;

  // Key nutrients to display
  const items = [
    { key: "sodium_mg", label: "Sodium", unit: "mg", value: nutrition.sodium_mg ?? nutrition.sodium },
    { key: "carbs_g", label: "Carbs", unit: "g", value: nutrition.carbs_g ?? nutrition.carbohydrates },
    { key: "sugar_g", label: "Sugar", unit: "g", value: nutrition.sugar_g ?? nutrition.sugar },
    { key: "calories", label: "Calories", unit: "kcal", value: nutrition.calories ?? nutrition.energy_kcal },
    { key: "fat_g", label: "Fat", unit: "g", value: nutrition.fat_g ?? nutrition.fat },
    { key: "protein_g", label: "Protein", unit: "g", value: nutrition.protein_g ?? nutrition.protein },
    { key: "fiber_g", label: "Fiber", unit: "g", value: nutrition.fiber_g ?? nutrition.fiber }
  ].filter(i => i.value !== undefined && i.value !== null);

  return (
    <section className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-[#E6F4FF] text-[#1677FF] flex items-center justify-center">
          <Activity size={18} />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#15171A]">Nutritional Profile</h3>
          <p className="text-xs text-[#69707A]">
            {hasNutrition ? "Measured & condition-specific nutritional analysis" : "No verified nutrition data returned"}
          </p>
        </div>
      </div>

      {/* Condition-specific Nutrition Flags */}
      {nutritionFlags.length > 0 && (
        <div className="mb-6 space-y-2">
          {nutritionFlags.map((flag, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#FFF1F0] border border-[#FF4D4F]/30 text-xs text-[#820014] flex items-start gap-2.5"
            >
              <AlertTriangle size={15} className="text-[#FF4D4F] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase tracking-wide text-[#CF1322] block mb-0.5">
                  Nutritional Limit Flag: {flag.nutrient}
                </span>
                <span>{flag.reason}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nutrients Grid */}
      {items.length === 0 ? (
        <div className="p-6 bg-[#F4F5F7] rounded-2xl text-center">
          <p className="text-xs font-semibold text-[#69707A]">
            Specific nutritional values were not available for this food item.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map((item) => (
            <div
              key={item.key}
              className="p-4 rounded-2xl bg-[#F4F5F7]/70 border border-[#E5E8EC] flex flex-col justify-between"
            >
              <span className="text-xs font-semibold text-[#69707A] block">{item.label}</span>
              <div className="mt-2">
                <span className="text-xl font-extrabold text-[#15171A]">
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </span>
                <span className="text-xs text-[#69707A] ml-1 font-semibold">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
