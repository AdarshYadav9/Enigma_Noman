import Link from 'next/link';
import { UserCheck, ArrowRight } from 'lucide-react';

interface ProfileRequiredCardProps {
  onDismiss?: () => void;
}

export default function ProfileRequiredCard({ onDismiss }: ProfileRequiredCardProps) {
  return (
    <div className="bg-gradient-to-br from-[#E6F4FF] to-blue-50 border border-[#1677FF]/30 rounded-2xl p-6 text-left shadow-sm animate-in fade-in">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#1677FF] text-white flex items-center justify-center shrink-0 shadow-md">
          <UserCheck size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-[#15171A]">Health Profile Required</h3>
          <p className="text-sm text-[#69707A] mt-1 leading-relaxed">
            To provide accurate, personalized dietary risk assessments and safe alternatives, please set up your dietary and health profile.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1677FF] text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-colors shadow-sm"
            >
              Complete Health Profile <ArrowRight size={15} />
            </Link>
            {onDismiss && (
              <button
                onClick={onDismiss}
                type="button"
                className="text-xs font-semibold text-[#69707A] hover:text-[#15171A]"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
