"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function HiddenAlertBox({ alerts }: { alerts: { term: string; meaning: string }[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="mt-6 border-2 border-yellow-300 bg-yellow-50 rounded-xl overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex justify-between items-center p-4 bg-yellow-100 text-yellow-800 font-bold hover:bg-yellow-200 transition-colors"
      >
        <span>🕵️ Hidden Ingredient Alerts ({alerts.length})</span>
        {expanded ? <ChevronUp /> : <ChevronDown />}
      </button>
      
      {expanded && (
        <div className="p-4 flex flex-col gap-3">
          {alerts.map((alert, i) => (
            <div key={i} className="text-sm text-yellow-900 bg-white p-3 rounded shadow-sm">
              <span className="font-bold text-black capitalize">{alert.term}</span> actually means:{' '}
              <span className="font-medium">{alert.meaning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
