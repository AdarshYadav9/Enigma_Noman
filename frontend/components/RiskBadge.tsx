import { RiskLevel } from '../types';

export default function RiskBadge({ risk_level }: { risk_level: RiskLevel }) {
  if (risk_level === 'high') {
    return (
      <div className="px-6 py-3 rounded-full text-xl font-bold bg-red-100 text-red-700 border-2 border-red-300 inline-block">
        🔴 HIGH RISK
      </div>
    );
  }
  if (risk_level === 'moderate') {
    return (
      <div className="px-6 py-3 rounded-full text-xl font-bold bg-yellow-100 text-yellow-700 border-2 border-yellow-300 inline-block">
        🟡 MODERATE RISK
      </div>
    );
  }
  return (
    <div className="px-6 py-3 rounded-full text-xl font-bold bg-green-100 text-green-700 border-2 border-green-300 inline-block">
      🟢 LOW RISK
    </div>
  );
}
