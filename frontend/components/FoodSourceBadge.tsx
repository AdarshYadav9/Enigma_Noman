import { FoodSource } from '../types';
import { Package, Home, UtensilsCrossed } from 'lucide-react';

interface FoodSourceBadgeProps {
  source?: FoodSource | string;
  size?: "sm" | "md";
  className?: string;
}

export default function FoodSourceBadge({ 
  source = "home", 
  size = "md",
  className = "" 
}: FoodSourceBadgeProps) {
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  const iconSize = size === "sm" ? 11 : 13;

  if (source === "packaged") {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#E6F4FF] text-[#1677FF] border border-[#1677FF]/20 font-semibold ${pad} ${className}`}>
        <Package size={iconSize} aria-hidden="true" />
        Packaged Food
      </span>
    );
  }

  if (source === "restaurant") {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#FFF7E6] text-[#FA8C16] border border-[#FA8C16]/20 font-semibold ${pad} ${className}`}>
        <UtensilsCrossed size={iconSize} aria-hidden="true" />
        Restaurant Food
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#F6FFED] text-[#52C41A] border border-[#52C41A]/20 font-semibold ${pad} ${className}`}>
      <Home size={iconSize} aria-hidden="true" />
      Home Food
    </span>
  );
}
