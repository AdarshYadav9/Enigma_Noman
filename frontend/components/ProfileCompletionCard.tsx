import Link from 'next/link';
import { UserHealthProfile } from '../types';
import { ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

interface ProfileCompletionCardProps {
  profile: UserHealthProfile | null;
}

export function calculateProfileCompletion(profile: UserHealthProfile | null): number {
  if (!profile) return 0;
  let score = 0;
  if (profile.age !== null && profile.age !== undefined && profile.age > 0) score += 20;
  if (profile.height_cm !== null && profile.height_cm !== undefined && profile.height_cm > 0) score += 20;
  if (profile.conditions && profile.conditions.length > 0) score += 20;
  if (profile.allergies && profile.allergies.length > 0) score += 20;
  if ((profile.dietary_restrictions && profile.dietary_restrictions.length > 0) ||
      (profile.health_restrictions && profile.health_restrictions.length > 0) ||
      (profile.doctor_advised_restrictions && profile.doctor_advised_restrictions.length > 0)) {
    score += 20;
  }
  return Math.min(100, Math.max(score, profile ? 20 : 0));
}

export default function ProfileCompletionCard({ profile }: ProfileCompletionCardProps) {
  const percent = calculateProfileCompletion(profile);

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E5E8EC] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#E6F4FF] text-[#1677FF] flex items-center justify-center">
            {percent === 100 ? <UserCheck size={18} /> : <ShieldCheck size={18} />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#15171A]">Your Health Profile</h4>
            <span className="text-xs text-[#69707A]">{percent}% Complete</span>
          </div>
        </div>

        <Link
          href="/profile"
          className="text-xs font-semibold text-[#1677FF] hover:underline flex items-center gap-1"
        >
          {profile ? "Edit" : "Complete"} <ArrowRight size={13} />
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#F4F5F7] h-2 rounded-full overflow-hidden mb-2">
        <div
          className="bg-gradient-to-r from-[#1677FF] to-blue-400 h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-xs text-[#69707A]">
        {percent === 100
          ? "Your profile is fully configured for high-accuracy personalized alerts."
          : "Complete your profile to receive high-precision allergy & dietary risk analysis."}
      </p>
    </div>
  );
}
