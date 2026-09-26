import { FoodSource } from '../types';
import { Package, Home, UtensilsCrossed } from 'lucide-react';

interface FoodSourceSelectorProps {
  selectedSource: FoodSource;
  onSelectSource: (source: FoodSource) => void;
}

export default function FoodSourceSelector({
  selectedSource,
  onSelectSource
}: FoodSourceSelectorProps) {
  const sources = [
    {
      id: "packaged" as FoodSource,
      title: "Packaged Food",
      subtitle: "Barcode scan & package label OCR",
      icon: Package,
      activeColor: "border-[#1677FF] bg-[#E6F4FF]/40 text-[#1677FF]",
      iconBg: "bg-[#E6F4FF] text-[#1677FF]"
    },
    {
      id: "home" as FoodSource,
      title: "Home Food",
      subtitle: "Home-cooked meals, voice & custom recipes",
      icon: Home,
      activeColor: "border-[#52C41A] bg-[#F6FFED]/50 text-[#52C41A]",
      iconBg: "bg-[#F6FFED] text-[#52C41A]"
    },
    {
      id: "restaurant" as FoodSource,
      title: "Restaurant Food",
      subtitle: "Dine-out dishes & restaurant menu OCR",
      icon: UtensilsCrossed,
      activeColor: "border-[#FA8C16] bg-[#FFF7E6]/50 text-[#FA8C16]",
      iconBg: "bg-[#FFF7E6] text-[#FA8C16]"
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-[#15171A]">What are you eating?</label>
        <span className="text-xs text-[#69707A]">Select food source to tailor analysis</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sources.map((item) => {
          const isSelected = selectedSource === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSource(item.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? `${item.activeColor} shadow-sm ring-2 ring-offset-1 ring-blue-500`
                  : "bg-white border-[#E5E8EC] hover:border-gray-300 hover:bg-gray-50/50"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                  <Icon size={20} />
                </div>
                {isSelected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-current" />
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-[15px] text-[#15171A] leading-tight mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-[#69707A] leading-relaxed">
                  {item.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
