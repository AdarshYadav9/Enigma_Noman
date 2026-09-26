"use client";

import { useUserStore } from '../store/userStore';
import { Condition } from '../types';

const CONDITIONS: { id: Condition; label: string; icon: string }[] = [
  { id: "diabetes", label: "Diabetes", icon: "🩸" },
  { id: "hypertension", label: "Hypertension", icon: "💗" },
  { id: "ckd", label: "CKD (Kidney)", icon: "🫘" },
  { id: "pcos", label: "PCOS", icon: "🌸" },
  { id: "allergy", label: "Allergy", icon: "⚠️" },
];

export default function ConditionSelector() {
  const { conditions, setConditions } = useUserStore();

  const toggleCondition = (id: Condition) => {
    if (conditions.includes(id)) {
      setConditions(conditions.filter(c => c !== id));
    } else {
      setConditions([...conditions, id]);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {CONDITIONS.map((c) => {
        const isSelected = conditions.includes(c.id);
        return (
          <button
            key={c.id}
            onClick={() => toggleCondition(c.id)}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              isSelected
                ? "border-red-500 bg-red-50"
                : "border-gray-200 bg-white hover:border-red-200"
            }`}
          >
            <span className="text-3xl">{c.icon}</span>
            <span className="font-medium text-gray-800">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
