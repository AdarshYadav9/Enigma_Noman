"use client";
import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export default function HiddenAlertBox({ 
  term, 
  reason, 
  alternatives 
}: { 
  term: string, 
  reason: string, 
  alternatives: string[] 
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-[#E5E8EC] rounded-2xl overflow-hidden shadow-sm transition-all hover:border-[#1677FF]/30">
      <button 
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div aria-hidden="true" className="w-8 h-8 rounded-full bg-[#FFFBE6] text-[#FAAD14] flex items-center justify-center shrink-0">
            <Search size={16} />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-bold text-[#69707A] uppercase tracking-widest mb-0.5">Detected Term</span>
            <span className="block font-bold text-[#15171A] uppercase tracking-wide break-words">{term}</span>
          </div>
        </div>
        <div className="text-[#69707A] flex items-center gap-2 text-sm font-medium shrink-0">
          <span className="hidden sm:inline">Needs review</span>
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      
      {open && (
        <div className="p-4 pt-0 border-t border-[#E5E8EC] bg-[#F9FBFF]">
          <div className="mt-4 flex gap-3">
            <AlertCircle className="text-[#1677FF] shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-bold text-[#15171A] mb-1">Why it matters</p>
              <p className="text-[#69707A] text-sm leading-relaxed mb-4">{reason}</p>
              
              {alternatives.length > 0 && (
                <>
                  <p className="text-sm font-bold text-[#15171A] mb-2">What you can check next</p>
                  <div className="flex flex-wrap gap-2">
                    {alternatives.map(alt => (
                      <span key={alt} className="px-2 py-1 bg-white border border-[#E5E8EC] rounded text-xs text-[#69707A] font-medium">
                        {alt}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
