"use client";

import { useUserStore } from '../store/userStore';
import { Condition } from '../types';

const availableConditions: { id: Condition; label: string; desc: string }[] = [
  { id: "diabetes", label: "Diabetes", desc: "Carbohydrate & sugar considerations" },
  { id: "hypertension", label: "Hypertension", desc: "Sodium & processed ingredients" },
  { id: "ckd", label: "CKD", desc: "Sodium & specific mineral considerations" },
  { id: "pcos", label: "PCOS", desc: "Refined carbs & added sugars" },
  { id: "allergy", label: "Food Allergy", desc: "Ingredient-specific considerations" }
];

export default function ConditionSelector() {
  const { conditions, toggleCondition } = useUserStore();

  return (
    <div className="space-y-3">
      {availableConditions.map(c => {
        const isSelected = conditions.includes(c.id);
        return (
          <button
            key={c.id}
            onClick={() => toggleCondition(c.id)}
            aria-pressed={isSelected}
            className={`w-full flex items-start gap-3 p-4 rounded-2xl border transition-all text-left ${
              isSelected
                ? "bg-[#EAF3FF] border-[#1677FF] shadow-[0_2px_10px_rgba(22,119,255,0.1)]"
                : "bg-white border-[#E5E8EC] hover:border-[#1677FF] hover:bg-[#F9FBFF]"
            }`}
          >
            <div aria-hidden="true" className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              isSelected ? "border-[#1677FF] bg-[#1677FF]" : "border-[#E5E8EC]"
            }`}>
              {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <div>
              <span className={`block font-bold text-[15px] ${isSelected ? "text-[#1677FF]" : "text-[#15171A]"}`}>
                {c.label}
              </span>
              <span className={`block text-xs mt-1 leading-tight ${isSelected ? "text-[#1677FF]/80" : "text-[#69707A]"}`}>
                {c.desc}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  );
}
