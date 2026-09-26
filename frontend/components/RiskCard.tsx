"use client";

import { RiskResult } from '../types';
import RiskBadge from './RiskBadge';
import FoodSourceBadge from './FoodSourceBadge';
import InputModeBadge from './InputModeBadge';
import AllergyConflictCard from './AllergyConflictCard';
import AlternativeFoodCard from './AlternativeFoodCard';
import ConfidenceCard from './ConfidenceCard';
import UncertaintyCard from './UncertaintyCard';
import UnknownFoodCard from './UnknownFoodCard';
import NutritionSummary from './NutritionSummary';
import { 
  Activity, 
  ShieldCheck, 
  AlertCircle, 
  HelpCircle, 
  Info, 
  AlertTriangle,
  FileText
} from 'lucide-react';

interface RiskCardProps {
  result: RiskResult;
  dishName?: string;
}

export default function RiskCard({ result, dishName }: RiskCardProps) {
  // If unknown food state, render dedicated UnknownFoodCard
  if (result.status === "unknown") {
    return (
      <UnknownFoodCard
        foodName={result.food_name || dishName}
        message={result.explanation}
        reason={result.reason}
      />
    );
  }

  const effectiveName = result.food_name || dishName || "Food Analysis";
  
  // Resolve risk score safely across formats
  const rawScore = result.risk_score !== undefined && result.risk_score !== null
    ? result.risk_score
    : (result as any).risk?.score !== undefined && (result as any).risk?.score !== null
      ? (result as any).risk.score
      : null;

  // Fallback to deterministic conflict score if not explicitly set
  const score = rawScore !== null
    ? rawScore
    : result.risk_level === "high"
      ? 75
      : result.risk_level === "moderate"
        ? 40
        : result.risk_level === "low"
          ? 10
          : 0;

  // Safe and flagged ingredients
  const flaggedIngredients = new Set([
    ...(result.flags || []).map(f => f.ingredient.toLowerCase()),
    ...(result.hidden_alerts || []).map(h => h.term.toLowerCase())
  ]);

  const allIngredients = result.safe_ingredients && result.safe_ingredients.length > 0
    ? result.safe_ingredients
    : (result.ingredients_found || []);

  const safeList = allIngredients.filter(i => !flaggedIngredients.has(i.toLowerCase()));

  // Score meter color
  const getScoreColor = (sc: number | null | undefined) => {
    if (sc === null || sc === undefined) return "text-gray-400";
    if (sc >= 50) return "text-[#FF4D4F]";
    if (sc >= 20) return "text-[#FAAD14]";
    return "text-[#52C41A]";
  };

  const getGaugeBg = (sc: number | null | undefined) => {
    if (sc === null || sc === undefined) return "stroke-gray-300";
    if (sc >= 50) return "stroke-[#FF4D4F]";
    if (sc >= 20) return "stroke-[#FAAD14]";
    return "stroke-[#52C41A]";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Food Identity Card */}
      <section className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <FoodSourceBadge source={result.food_source} />
              <InputModeBadge mode={result.input_mode} />
              {result.confidence && (
                <span className="text-xs text-[#69707A] font-semibold bg-[#F4F5F7] px-2.5 py-1 rounded-full border border-[#E5E8EC]">
                  Confidence: {Math.round((result.confidence.overall ?? 0) * 100)}%
                </span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold text-[#15171A] capitalize">
              {effectiveName}
            </h1>
            {result.normalized_name && result.normalized_name.toLowerCase() !== effectiveName.toLowerCase() && (
              <p className="text-xs text-[#69707A] mt-0.5">
                Matched canonical: <span className="font-semibold text-[#15171A] capitalize">{result.normalized_name}</span>
              </p>
            )}
          </div>

          <div className="shrink-0 flex sm:flex-col items-start sm:items-end justify-between">
            <span className="text-[11px] font-bold text-[#69707A] uppercase tracking-wider mb-1.5 hidden sm:block">
              Risk Evaluation
            </span>
            <RiskBadge risk_level={result.risk_level} />
          </div>
        </div>
      </section>

      {/* 2. Allergy Conflict Alert (Top Priority) */}
      {result.allergy_conflicts && result.allergy_conflicts.length > 0 && (
        <AllergyConflictCard conflicts={result.allergy_conflicts} />
      )}

      {/* 3. Risk Assessment & Score Meter */}
      <section className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Gauge Meter */}
          <div className="flex flex-col items-center justify-center p-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#F4F5F7" strokeWidth="10" />
                {score !== null && score !== undefined && (
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    strokeWidth="10"
                    strokeDasharray={314}
                    strokeDashoffset={314 - (314 * Math.min(score, 100)) / 100}
                    strokeLinecap="round"
                    className={`${getGaugeBg(score)} transition-all duration-1000`}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-3xl font-extrabold ${getScoreColor(score)}`}>
                  {score !== null && score !== undefined ? score : "—"}
                </span>
                <span className="text-[10px] font-bold text-[#69707A] uppercase tracking-widest">
                  / 100
                </span>
              </div>
            </div>

            <span className="text-xs font-bold text-[#15171A] mt-2">
              Dietary Risk Indicator
            </span>
            <span className="text-[11px] text-[#69707A]">
              Rule-based conflict score (not medical probability)
            </span>
          </div>

          {/* Explanation & User Profile Context */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="text-[#1677FF]" size={18} />
              <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wider">
                Why this result?
              </h3>
            </div>

            <p className="text-sm text-[#15171A] leading-relaxed font-medium">
              {result.explanation}
            </p>

            {/* Profile fields considered */}
            {result.user_context && (
              <div className="pt-3 border-t border-[#E5E8EC]">
                <span className="text-xs font-bold text-[#69707A] uppercase tracking-wider block mb-2">
                  Profile constraints evaluated:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.user_context.conditions_considered?.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-[#E6F4FF] text-[#1677FF] text-xs font-semibold capitalize">
                      ✓ Condition: {c}
                    </span>
                  ))}
                  {result.user_context.allergies_considered?.map((a, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-[#FFF1F0] text-[#FF4D4F] text-xs font-semibold capitalize">
                      ✓ Allergy: {a}
                    </span>
                  ))}
                  {result.user_context.restrictions_considered?.map((r, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-[#F6FFED] text-[#52C41A] text-xs font-semibold capitalize">
                      ✓ Restriction: {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Condition & Health Findings */}
      {result.findings && result.findings.length > 0 && (
        <section className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-[#1677FF]" size={18} />
            <h3 className="text-base font-bold text-[#15171A]">Health & Condition Findings</h3>
          </div>

          <div className="space-y-2.5">
            {result.findings.map((f, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#F4F5F7] border border-[#E5E8EC] flex items-start gap-3 text-xs"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${f.risk_level === 'high' ? 'bg-[#FF4D4F]' : 'bg-[#FAAD14]'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    {f.ingredient && (
                      <span className="font-extrabold text-[#15171A] capitalize">{f.ingredient}</span>
                    )}
                    {f.condition && (
                      <span className="px-2 py-0.5 rounded bg-white text-[#69707A] text-[10px] font-bold border border-[#E5E8EC] capitalize">
                        {f.condition}
                      </span>
                    )}
                  </div>
                  <span className="text-[#69707A]">{f.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Nutritional Profile */}
      <NutritionSummary
        nutrition={result.nutrition}
        nutritionFlags={result.nutrition_flags}
      />

      {/* 6. Ingredient Analysis & Ambiguous Terms */}
      <section className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC]">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="text-[#1677FF]" size={18} />
          <h3 className="text-base font-bold text-[#15171A]">Ingredients Breakdown</h3>
        </div>

        {/* Ambiguous Terms Alerts */}
        {((result.ambiguous_terms && result.ambiguous_terms.length > 0) ||
          (result.hidden_alerts && result.hidden_alerts.length > 0)) && (
          <div className="mb-4 space-y-2">
            {(result.ambiguous_terms || []).map((termItem, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#FFFBE6] border border-[#FAAD14]/30 text-xs text-[#874D00] flex items-start gap-2"
              >
                <AlertTriangle size={14} className="text-[#FAAD14] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold capitalize">{termItem.term}: </span>
                  <span>{termItem.message || "Ingredient composition is not fully specified."}</span>
                </div>
              </div>
            ))}
            {(result.hidden_alerts || []).map((h, idx) => (
              <div
                key={`h-${idx}`}
                className="p-3 rounded-xl bg-[#FFFBE6] border border-[#FAAD14]/30 text-xs text-[#874D00] flex items-start gap-2"
              >
                <AlertTriangle size={14} className="text-[#FAAD14] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold capitalize">{h.term}: </span>
                  <span>{h.meaning}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ingredient Pills */}
        <div className="flex flex-wrap gap-2">
          {safeList.map((ing, idx) => (
            <span
              key={`safe-${idx}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F6FFED] border border-[#52C41A]/30 text-[#52C41A] text-xs font-semibold capitalize"
            >
              <ShieldCheck size={13} /> {ing}
            </span>
          ))}

          {Array.from(flaggedIngredients).map((ing, idx) => (
            <span
              key={`flag-${idx}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF1F0] border border-[#FF4D4F]/30 text-[#FF4D4F] text-xs font-semibold capitalize"
            >
              <AlertCircle size={13} /> {ing}
            </span>
          ))}
        </div>
      </section>

      {/* 7. Screened Safe Alternatives */}
      <AlternativeFoodCard
        alternatives={result.alternatives}
        message={result.alternative_message}
      />

      {/* 8. Confidence Breakdown */}
      <ConfidenceCard confidence={result.confidence} />

      {/* 9. Uncertainty & Limitations */}
      <UncertaintyCard
        uncertainty={result.uncertainty}
        foodSource={result.food_source}
      />

      {/* 10. Medical Disclaimer (Always at bottom) */}
      <footer className="text-center p-6 bg-[#F4F5F7] rounded-2xl border border-[#E5E8EC]">
        <p className="text-xs text-[#69707A] leading-relaxed max-w-2xl mx-auto">
          {result.disclaimer ||
            "This is an informational dietary risk assessment based on rule-matching against your health profile, not a clinical medical diagnosis or treatment plan."}
        </p>
      </footer>
    </div>
  );
}

interface FoodAnalyzeRequestProps {
  // Type compatibility helper
}
