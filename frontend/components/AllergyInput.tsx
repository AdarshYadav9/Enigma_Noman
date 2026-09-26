"use client";

import { useState } from 'react';
import { X, Plus, ShieldAlert } from 'lucide-react';

const COMMON_ALLERGENS = [
  "Peanut",
  "Milk",
  "Egg",
  "Shellfish",
  "Soy",
  "Tree nuts",
  "Wheat",
  "Mustard",
  "Sesame"
];

interface AllergyInputProps {
  allergies: string[];
  onChange: (allergies: string[]) => void;
}

export default function AllergyInput({ allergies, onChange }: AllergyInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = (allergenToAdd?: string) => {
    const value = (allergenToAdd || inputValue).trim().toLowerCase();
    if (!value) return;

    // Duplicate prevention
    if (allergies.map(a => a.toLowerCase()).includes(value)) {
      setInputValue("");
      return;
    }

    onChange([...allergies, value]);
    setInputValue("");
  };

  const handleRemove = (allergenToRemove: string) => {
    onChange(allergies.filter(a => a.toLowerCase() !== allergenToRemove.toLowerCase()));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-bold text-[#15171A]">
          Confirmed Food Allergies
        </label>
        <span className="text-xs text-[#69707A]">Used strictly for high-priority conflict alerts</span>
      </div>

      {/* Selected Allergy Tags */}
      <div className="flex flex-wrap gap-2 min-h-[38px] p-2 bg-[#F4F5F7] rounded-xl border border-[#E5E8EC]">
        {allergies.length === 0 ? (
          <span className="text-xs text-[#69707A] flex items-center gap-1.5 px-2 py-1">
            <ShieldAlert size={14} />
            No allergies recorded. Select below or type a custom allergen.
          </span>
        ) : (
          allergies.map((allergy) => (
            <span
              key={allergy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1F0] border border-[#FF4D4F]/30 text-[#FF4D4F] text-xs font-semibold capitalize animate-in fade-in"
            >
              {allergy}
              <button
                type="button"
                onClick={() => handleRemove(allergy)}
                aria-label={`Remove ${allergy}`}
                className="hover:text-red-800 focus:outline-none"
              >
                <X size={13} />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Input Field */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type an allergy (e.g. peanut, walnut)..."
          className="flex-1 bg-white border border-[#E5E8EC] rounded-xl px-3.5 py-2 text-sm text-[#15171A] placeholder:text-[#69707A] focus:outline-none focus:ring-2 focus:ring-[#1677FF]"
        />
        <button
          type="button"
          onClick={() => handleAdd()}
          className="px-4 py-2 bg-[#1677FF] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center gap-1.5"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Common Suggestions */}
      <div>
        <span className="text-xs font-semibold text-[#69707A] block mb-2">Common allergens:</span>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_ALLERGENS.map((allergen) => {
            const isSelected = allergies.map(a => a.toLowerCase()).includes(allergen.toLowerCase());
            return (
              <button
                key={allergen}
                type="button"
                onClick={() => isSelected ? handleRemove(allergen) : handleAdd(allergen)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  isSelected
                    ? "bg-[#FFF1F0] text-[#FF4D4F] border-[#FF4D4F]/30 font-semibold"
                    : "bg-white text-[#69707A] border-[#E5E8EC] hover:border-[#1677FF] hover:text-[#1677FF]"
                }`}
              >
                {isSelected ? `✓ ${allergen}` : `+ ${allergen}`}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
