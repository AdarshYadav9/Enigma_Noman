"use client";

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface RestrictionInputProps {
  label: string;
  description?: string;
  items: string[];
  suggestions?: string[];
  placeholder?: string;
  badgeColor?: "blue" | "green" | "purple";
  onChange: (items: string[]) => void;
}

export default function RestrictionInput({
  label,
  description,
  items,
  suggestions = [],
  placeholder = "Add an item...",
  badgeColor = "blue",
  onChange
}: RestrictionInputProps) {
  const [inputValue, setInputValue] = useState("");

  const colorStyles = {
    blue: "bg-[#E6F4FF] border-[#1677FF]/30 text-[#1677FF]",
    green: "bg-[#F6FFED] border-[#52C41A]/30 text-[#52C41A]",
    purple: "bg-[#F9F0FF] border-[#722ED1]/30 text-[#722ED1]"
  }[badgeColor];

  const handleAdd = (itemToAdd?: string) => {
    const value = (itemToAdd || inputValue).trim().toLowerCase();
    if (!value) return;

    if (items.map(i => i.toLowerCase()).includes(value)) {
      setInputValue("");
      return;
    }

    onChange([...items, value]);
    setInputValue("");
  };

  const handleRemove = (itemToRemove: string) => {
    onChange(items.filter(i => i.toLowerCase() !== itemToRemove.toLowerCase()));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-bold text-[#15171A]">{label}</label>
        {description && <p className="text-xs text-[#69707A] mt-0.5">{description}</p>}
      </div>

      {/* Selected Items */}
      <div className="flex flex-wrap gap-2 min-h-[38px] p-2 bg-[#F4F5F7] rounded-xl border border-[#E5E8EC]">
        {items.length === 0 ? (
          <span className="text-xs text-[#69707A] px-2 py-1">No items selected yet.</span>
        ) : (
          items.map((item) => (
            <span
              key={item}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold capitalize animate-in fade-in ${colorStyles}`}
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                aria-label={`Remove ${item}`}
                className="hover:opacity-75 focus:outline-none"
              >
                <X size={13} />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-white border border-[#E5E8EC] rounded-xl px-3.5 py-2 text-sm text-[#15171A] placeholder:text-[#69707A] focus:outline-none focus:ring-2 focus:ring-[#1677FF]"
        />
        <button
          type="button"
          onClick={() => handleAdd()}
          className="px-4 py-2 bg-white border border-[#E5E8EC] text-[#15171A] rounded-xl text-sm font-semibold hover:border-[#1677FF] hover:text-[#1677FF] transition-colors flex items-center gap-1.5"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((sug) => {
            const isSelected = items.map(i => i.toLowerCase()).includes(sug.toLowerCase());
            return (
              <button
                key={sug}
                type="button"
                onClick={() => isSelected ? handleRemove(sug) : handleAdd(sug)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  isSelected
                    ? "bg-[#1677FF] text-white border-[#1677FF] font-semibold"
                    : "bg-white text-[#69707A] border-[#E5E8EC] hover:border-[#1677FF] hover:text-[#1677FF]"
                }`}
              >
                {isSelected ? `✓ ${sug}` : `+ ${sug}`}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
