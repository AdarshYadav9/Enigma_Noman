"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getFoodHistory, getErrorMessage } from '../../services/api';
import { useUserStore } from '../../store/userStore';
import { FoodAnalysisHistoryItem, RiskLevel, FoodSource } from '../../types';
import RiskBadge from '../../components/RiskBadge';
import FoodSourceBadge from '../../components/FoodSourceBadge';
import InputModeBadge from '../../components/InputModeBadge';
import { 
  Clock, 
  Search, 
  Filter, 
  Loader2, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { user, setCurrentAnalysis, setDishName } = useUserStore();

  const [historyItems, setHistoryItems] = useState<FoodAnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>("all");
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>("all");

  const fetchHistory = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await getFoodHistory(50, 0);
      setHistoryItems(res.history || []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Could not load analysis history. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  // Filter items
  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.food_name?.toLowerCase().includes(query);
        const matchesNorm = item.normalized_food_name?.toLowerCase().includes(query);
        if (!matchesName && !matchesNorm) return false;
      }

      // Risk filter
      if (selectedRiskFilter !== "all") {
        if (item.risk_level !== selectedRiskFilter) return false;
      }

      // Source filter
      if (selectedSourceFilter !== "all") {
        if (item.food_source !== selectedSourceFilter) return false;
      }

      return true;
    });
  }, [historyItems, searchQuery, selectedRiskFilter, selectedSourceFilter]);

  const handleViewAnalysis = (item: FoodAnalysisHistoryItem) => {
    const analysis = item.result_json || {
      food_name: item.food_name || "Food Item",
      risk_level: item.risk_level,
      risk_score: item.risk_score,
      food_source: item.food_source,
      input_mode: item.input_mode,
      explanation: "Analysis loaded from history."
    };

    setDishName(item.food_name || "Food Item");
    setCurrentAnalysis(analysis);
    router.push("/result");
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) {
        return `Today • ${timeString}`;
      }
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • ${timeString}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="pb-16 animate-in fade-in duration-500">
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#15171A] flex items-center gap-3">
            <Clock className="text-[#1677FF]" size={28} />
            Food Analysis History
          </h1>
          <p className="text-[#69707A] mt-1.5 text-sm sm:text-base">
            Review previous meals, dietary risk assessments, and identified allergen conflicts.
          </p>
        </div>

        {user && (
          <button
            onClick={fetchHistory}
            disabled={isLoading}
            className="self-start sm:self-auto px-4 py-2 bg-white border border-[#E5E8EC] rounded-2xl text-xs font-bold text-[#15171A] hover:bg-gray-50 flex items-center gap-2 transition-all shadow-xs"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] space-y-6">
        
        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#69707A]" size={20} />
            <input
              type="text"
              placeholder="Search history by dish name (e.g. poha, paneer tikka)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F4F5F7] border border-[#E5E8EC] rounded-2xl py-3.5 pl-12 pr-4 text-[#15171A] text-sm focus:outline-none focus:ring-2 focus:ring-[#EAF3FF] focus:border-[#1677FF] transition-all"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#69707A] font-bold flex items-center gap-1 mr-1">
              <Filter size={14} /> Filter:
            </span>

            {/* Risk Filters */}
            {[
              { id: "all", label: "All Risks" },
              { id: "high", label: "High Risk" },
              { id: "moderate", label: "Moderate" },
              { id: "low", label: "Low Risk" },
              { id: "unknown", label: "Unknown" }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedRiskFilter(f.id)}
                className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                  selectedRiskFilter === f.id
                    ? "bg-[#1677FF] text-white shadow-xs"
                    : "bg-[#F4F5F7] text-[#69707A] hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}

            <div className="h-4 w-px bg-gray-300 mx-1 hidden sm:block" />

            {/* Source Filters */}
            {[
              { id: "all", label: "All Sources" },
              { id: "packaged", label: "Packaged" },
              { id: "home", label: "Home" },
              { id: "restaurant", label: "Restaurant" }
            ].map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSourceFilter(s.id)}
                className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                  selectedSourceFilter === s.id
                    ? "bg-[#15171A] text-white shadow-xs"
                    : "bg-[#F4F5F7] text-[#69707A] hover:bg-gray-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Not Authenticated State */}
        {!user && !isLoading && (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-[#EAF3FF] rounded-full flex items-center justify-center text-[#1677FF] mx-auto">
              <Clock size={28} />
            </div>
            <h3 className="text-xl font-bold text-[#15171A]">Sign in to View Your History</h3>
            <p className="text-sm text-[#69707A] max-w-sm mx-auto">
              Your personalized food analyses are saved securely to your profile history.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1677FF] text-white rounded-2xl font-bold text-sm hover:bg-[#155ACC] transition-all shadow-md"
            >
              Sign In to Your Account
            </Link>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="animate-spin text-[#1677FF]" size={32} />
            <span className="text-sm font-bold text-[#15171A]">Loading history records...</span>
          </div>
        )}

        {/* Empty History State */}
        {!isLoading && user && filteredItems.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-[#F4F5F7] rounded-full flex items-center justify-center text-[#69707A] mx-auto">
              <Clock size={28} />
            </div>
            <h3 className="text-xl font-bold text-[#15171A]">
              {historyItems.length === 0 ? "No History Yet" : "No Matches Found"}
            </h3>
            <p className="text-sm text-[#69707A] max-w-sm mx-auto">
              {historyItems.length === 0
                ? "Analyze your first meal or snack from the dashboard to start logging your personalized history."
                : "No analyses match your search and filter criteria. Try adjusting your filters."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1677FF] text-white rounded-2xl font-bold text-sm hover:bg-[#155ACC] transition-all shadow-md"
            >
              <Sparkles size={16} /> Start New Analysis
            </Link>
          </div>
        )}

        {/* History Cards List */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-[#E5E8EC] hover:border-[#1677FF] hover:bg-[#F9FBFF] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white group"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-base text-[#15171A] capitalize">
                      {item.food_name || "Food Item"}
                    </h3>
                    <FoodSourceBadge source={item.food_source} size="sm" />
                    <InputModeBadge mode={item.input_mode} size="sm" />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#69707A]">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar size={13} /> {formatDate(item.created_at)}
                    </span>
                    {item.confidence && (
                      <span>• Confidence: {Math.round(item.confidence * 100)}%</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div className="text-right">
                    <RiskBadge level={item.risk_level} />
                    {item.risk_score !== null && item.risk_score !== undefined && (
                      <span className="block text-xs font-mono font-bold text-[#69707A] mt-1">
                        Score: {item.risk_score}/100
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleViewAnalysis(item)}
                    className="px-4 py-2 rounded-xl bg-[#F4F5F7] group-hover:bg-[#1677FF] group-hover:text-white font-bold text-xs text-[#15171A] transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    View Analysis <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}