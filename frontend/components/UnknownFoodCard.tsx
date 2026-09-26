import Link from 'next/link';
import { HelpCircle, Keyboard, Mic, Barcode, Camera, ArrowRight } from 'lucide-react';

interface UnknownFoodCardProps {
  foodName?: string | null;
  message?: string | null;
  reason?: string | null;
}

export default function UnknownFoodCard({ foodName, message, reason }: UnknownFoodCardProps) {
  return (
    <div className="bg-white rounded-[28px] p-8 sm:p-12 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] text-center max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-[#F4F5F7] text-[#69707A] flex items-center justify-center mx-auto mb-5 shadow-inner">
        <HelpCircle size={36} />
      </div>

      <span className="inline-block px-3 py-1 rounded-full bg-[#F4F5F7] text-xs font-bold text-[#69707A] uppercase tracking-wider mb-2">
        Zero Hallucination Safety
      </span>

      <h2 className="text-2xl font-extrabold text-[#15171A] mb-2">
        Food Not Confidently Identified
      </h2>

      <p className="text-sm font-semibold text-[#15171A] mb-2">
        {message || "I’m not sure about this food or item."}
      </p>

      <p className="text-xs text-[#69707A] max-w-md mx-auto leading-relaxed mb-8">
        {reason || "No verified nutritional record, ingredient list, or product information was found in the database. Rather than guessing, we recommend trying an alternate input method."}
      </p>

      {/* Suggested Try Next Actions */}
      <div className="border-t border-[#E5E8EC] pt-6">
        <span className="text-xs font-bold text-[#69707A] uppercase tracking-wider block mb-4">
          Try Another Method
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            href="/"
            className="p-3 rounded-xl border border-[#E5E8EC] bg-[#F4F5F7]/50 hover:bg-[#E6F4FF] hover:border-[#1677FF] text-xs font-bold text-[#15171A] flex flex-col items-center gap-1.5 transition-all"
          >
            <Keyboard size={18} className="text-[#1677FF]" />
            <span>Type Name</span>
          </Link>

          <Link
            href="/"
            className="p-3 rounded-xl border border-[#E5E8EC] bg-[#F4F5F7]/50 hover:bg-[#F9F0FF] hover:border-[#722ED1] text-xs font-bold text-[#15171A] flex flex-col items-center gap-1.5 transition-all"
          >
            <Mic size={18} className="text-[#722ED1]" />
            <span>Speak Dish</span>
          </Link>

          <Link
            href="/"
            className="p-3 rounded-xl border border-[#E5E8EC] bg-[#F4F5F7]/50 hover:bg-[#E6FFFB] hover:border-[#13C2C2] text-xs font-bold text-[#15171A] flex flex-col items-center gap-1.5 transition-all"
          >
            <Barcode size={18} className="text-[#13C2C2]" />
            <span>Scan Barcode</span>
          </Link>

          <Link
            href="/"
            className="p-3 rounded-xl border border-[#E5E8EC] bg-[#F4F5F7]/50 hover:bg-[#E6F4FF] hover:border-[#1677FF] text-xs font-bold text-[#15171A] flex flex-col items-center gap-1.5 transition-all"
          >
            <Camera size={18} className="text-[#1677FF]" />
            <span>OCR Label</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
