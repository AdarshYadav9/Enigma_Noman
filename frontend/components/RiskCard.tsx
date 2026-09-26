import { RiskResult } from '../types';
import RiskBadge from './RiskBadge';
import HiddenAlertBox from './HiddenAlertBox';
import { AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

const renderHighlightedText = (text: string, flags: RiskResult['flags']) => {
  if (!text) return null;
  const flagWords = flags.map(f => f.ingredient.toLowerCase());
  if (flagWords.length === 0) return <p className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">{text}</p>;

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b(${flagWords.map(escapeRegExp).join('|')})\\b`, 'gi');
  
  const parts = text.split(regex);
  return (
    <p className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200 leading-relaxed">
      {parts.map((part, i) => {
        if (flagWords.includes(part.toLowerCase())) {
          return <span key={i} className="bg-red-200 text-red-900 font-bold px-1.5 py-0.5 rounded shadow-sm relative group cursor-help">
            {part}
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-gray-900 text-white text-xs p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              This ingredient is flagged! See details below.
            </span>
          </span>;
        }
        return part;
      })}
    </p>
  );
};

export default function RiskCard({ result, dishName }: { result: RiskResult, dishName: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6 md:p-8 flex flex-col items-center text-center border-b border-gray-100 bg-slate-50">
        <h2 className="text-3xl font-bold text-gray-800 mb-4 capitalize">{dishName}</h2>
        <RiskBadge risk_level={result.risk_level} />
        <p className="mt-4 text-lg text-gray-600 max-w-lg">
          {result.explanation}
        </p>
      </div>

      {result.raw_text && (
        <div className="px-6 md:px-8 pt-8 pb-2">
          <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
            <FileText className="text-gray-500" size={20} />
            Extracted Text
          </h3>
          {renderHighlightedText(result.raw_text, result.flags)}
        </div>
      )}

      <div className="p-6 md:p-8 flex flex-col gap-6">
        {result.sodium_warning && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg flex items-start gap-3">
            <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" />
            <p className="text-orange-800 font-medium">{result.sodium_warning}</p>
          </div>
        )}

        {result.flags.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
              <span className="text-xl">⚠️</span> Flagged Ingredients
            </h3>
            <div className="flex flex-col gap-3">
              {result.flags.map((flag, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                    <span className="font-bold capitalize text-gray-800">{flag.ingredient}</span>
                  </div>
                  <div className="bg-white px-2 py-1 rounded text-xs font-bold text-gray-600 uppercase tracking-wider border">
                    {flag.condition}
                  </div>
                  <div className="text-sm text-gray-600 flex-1">
                    {flag.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.safe_ingredients.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
              <span className="text-xl">✅</span> Safe Ingredients
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.safe_ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 rounded-full text-sm font-medium">
                  <CheckCircle2 size={14} className="text-green-500" />
                  <span className="capitalize">{ing}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <HiddenAlertBox alerts={result.hidden_alerts} />
      </div>
    </div>
  );
}
