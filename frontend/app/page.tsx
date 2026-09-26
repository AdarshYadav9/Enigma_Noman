"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserStore } from '../store/userStore';
import { getProfile } from '../services/api';
import FoodSourceSelector from '../components/FoodSourceSelector';
import DishSearch from '../components/DishSearch';
import VoiceFoodInput from '../components/VoiceFoodInput';
import BarcodeInput from '../components/BarcodeInput';
import OCRUploader from '../components/OCRUploader';
import MenuOCR from '../components/MenuOCR';
import ProfileCompletionCard from '../components/ProfileCompletionCard';
import ConditionSelector from '../components/ConditionSelector';
import DailyTracker from '../components/DailyTracker';
import { FoodSource } from '../types';
import { 
  ShieldCheck, 
  Mic, 
  Barcode, 
  Camera, 
  Utensils, 
  Clock, 
  ChevronRight, 
  Sparkles,
  Search,
  PenLine,
  CalendarDays
} from 'lucide-react';

export default function Home() {
  const { 
    user, 
    profile, 
    setProfile, 
    selectedFoodSource, 
    setSelectedFoodSource,
    conditions 
  } = useUserStore();

  const [activeTab, setActiveTab] = useState<"search" | "voice" | "barcode" | "ocr" | "menu">("voice");

  // Fetch health profile on load if authenticated and not already loaded
  useEffect(() => {
    if (user && !profile) {
      getProfile()
        .then((p) => {
          if (p) setProfile(p);
        })
        .catch(() => {
          // If no profile exists yet, user will be prompted
        });
    }
  }, [user, profile, setProfile]);

  // Adjust default sub-tab when source changes
  const handleSelectSource = (src: FoodSource) => {
    setSelectedFoodSource(src);
    if (src === "packaged") {
      setActiveTab("barcode");
    } else if (src === "restaurant") {
      setActiveTab("search");
    } else {
      setActiveTab("voice");
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-14 animate-in fade-in duration-500">
      
      {/* 1. Header / Greeting Banner */}
      <section className="bg-white rounded-[28px] p-6 sm:p-8 md:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#EAF3FF] to-transparent opacity-60 pointer-events-none" />
        
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF3FF] text-[#1677FF] text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles size={14} />
            Personalized Food Safety
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#15171A] leading-[1.15] tracking-tight mb-3">
            What are you <span className="text-[#1677FF]">eating today?</span>
          </h1>
          
          <p className="text-sm sm:text-base text-[#69707A] leading-relaxed max-w-xl">
            Get instant, rule-based dietary risk alerts tailored directly to your health profile, allergies, and conditions.
          </p>
        </div>
      </section>

      {/* 2. Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Food Input Engine (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* A. Choose Food Source */}
          <section className="bg-white rounded-[28px] p-6 md:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] space-y-6">
            <FoodSourceSelector 
              selectedSource={selectedFoodSource} 
              onSelectSource={handleSelectSource} 
            />

            {/* B. Source-Specific Mode Switcher */}
            <div className="border-t border-[#E5E8EC] pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#69707A]">
                  Select Input Method ({selectedFoodSource})
                </span>
              </div>

              {/* Mode Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedFoodSource === "home" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab("voice")}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                        activeTab === "voice"
                          ? "bg-[#1677FF] text-white shadow-md"
                          : "bg-[#F4F5F7] text-[#69707A] hover:bg-gray-200"
                      }`}
                    >
                      <Mic size={15} /> Speak Food
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("search")}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                        activeTab === "search"
                          ? "bg-[#1677FF] text-white shadow-md"
                          : "bg-[#F4F5F7] text-[#69707A] hover:bg-gray-200"
                      }`}
                    >
                      <Search size={15} /> Search / Type Food
                    </button>
                  </>
                )}

                {selectedFoodSource === "packaged" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab("barcode")}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                        activeTab === "barcode"
                          ? "bg-[#1677FF] text-white shadow-md"
                          : "bg-[#F4F5F7] text-[#69707A] hover:bg-gray-200"
                      }`}
                    >
                      <Barcode size={15} /> Scan Barcode
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("ocr")}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                        activeTab === "ocr"
                          ? "bg-[#1677FF] text-white shadow-md"
                          : "bg-[#F4F5F7] text-[#69707A] hover:bg-gray-200"
                      }`}
                    >
                      <Camera size={15} /> Upload Package Label
                    </button>
                  </>
                )}

                {selectedFoodSource === "restaurant" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveTab("search")}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                        activeTab === "search"
                          ? "bg-[#1677FF] text-white shadow-md"
                          : "bg-[#F4F5F7] text-[#69707A] hover:bg-gray-200"
                      }`}
                    >
                      <Search size={15} /> Search Dish
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("voice")}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                        activeTab === "voice"
                          ? "bg-[#1677FF] text-white shadow-md"
                          : "bg-[#F4F5F7] text-[#69707A] hover:bg-gray-200"
                      }`}
                    >
                      <Mic size={15} /> Speak Dish
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("menu")}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                        activeTab === "menu"
                          ? "bg-[#1677FF] text-white shadow-md"
                          : "bg-[#F4F5F7] text-[#69707A] hover:bg-gray-200"
                      }`}
                    >
                      <Utensils size={15} /> Upload Menu Photo
                    </button>
                  </>
                )}
              </div>

              {/* C. Render Selected Input Experience */}
              <div className="min-h-[260px]">
                {activeTab === "voice" && (
                  <VoiceFoodInput foodSource={selectedFoodSource} />
                )}

                {activeTab === "search" && (
                  <DishSearch foodSource={selectedFoodSource} />
                )}

                {activeTab === "barcode" && (
                  <BarcodeInput onSwitchToOCR={() => setActiveTab("ocr")} />
                )}

                {activeTab === "ocr" && (
                  <OCRUploader />
                )}

                {activeTab === "menu" && (
                  <MenuOCR />
                )}
              </div>
            </div>
          </section>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => { setSelectedFoodSource("home"); setActiveTab("voice"); }}
              className="p-4 bg-white rounded-2xl border border-[#E5E8EC] hover:border-[#1677FF] hover:bg-[#F9FBFF] transition-all text-left flex flex-col justify-between group shadow-xs"
            >
              <Mic size={20} className="text-[#1677FF] mb-2 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-bold text-xs text-[#15171A] block">Speak Food</span>
                <span className="text-[10px] text-[#69707A]">Voice input</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedFoodSource("packaged"); setActiveTab("barcode"); }}
              className="p-4 bg-white rounded-2xl border border-[#E5E8EC] hover:border-[#1677FF] hover:bg-[#F9FBFF] transition-all text-left flex flex-col justify-between group shadow-xs"
            >
              <Barcode size={20} className="text-[#1677FF] mb-2 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-bold text-xs text-[#15171A] block">Scan Barcode</span>
                <span className="text-[10px] text-[#69707A]">Packaged item</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedFoodSource("packaged"); setActiveTab("ocr"); }}
              className="p-4 bg-white rounded-2xl border border-[#E5E8EC] hover:border-[#1677FF] hover:bg-[#F9FBFF] transition-all text-left flex flex-col justify-between group shadow-xs"
            >
              <Camera size={20} className="text-[#1677FF] mb-2 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-bold text-xs text-[#15171A] block">Upload Label</span>
                <span className="text-[10px] text-[#69707A]">OCR ingredients</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedFoodSource("restaurant"); setActiveTab("menu"); }}
              className="p-4 bg-white rounded-2xl border border-[#E5E8EC] hover:border-[#1677FF] hover:bg-[#F9FBFF] transition-all text-left flex flex-col justify-between group shadow-xs"
            >
              <Utensils size={20} className="text-[#1677FF] mb-2 group-hover:scale-110 transition-transform" />
              <div>
                <span className="font-bold text-xs text-[#15171A] block">Scan Menu</span>
                <span className="text-[10px] text-[#69707A]">Restaurant menu</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Column: User Health Profile & History Shortcuts (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Profile Completion Indicator */}
          <ProfileCompletionCard profile={profile} />

          {/* Quick Dietary Profile Overview */}
          <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#E5E8EC] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#15171A] flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#1677FF]" /> Active Health Context
              </h2>
              <Link href="/profile" className="text-xs font-bold text-[#1677FF] hover:underline">
                Edit
              </Link>
            </div>

            {profile ? (
              <div className="space-y-3 text-xs">
                {profile.allergies && profile.allergies.length > 0 && (
                  <div>
                    <span className="text-[#69707A] block mb-1 font-semibold">Allergies:</span>
                    <div className="flex flex-wrap gap-1">
                      {profile.allergies.map(a => (
                        <span key={a} className="px-2 py-0.5 bg-red-50 text-red-700 font-bold rounded-md border border-red-200">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.conditions && profile.conditions.length > 0 && (
                  <div>
                    <span className="text-[#69707A] block mb-1 font-semibold">Conditions:</span>
                    <div className="flex flex-wrap gap-1">
                      {profile.conditions.map(c => (
                        <span key={c} className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md border border-blue-200">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.dietary_restrictions && profile.dietary_restrictions.length > 0 && (
                  <div>
                    <span className="text-[#69707A] block mb-1 font-semibold">Dietary Restrictions:</span>
                    <div className="flex flex-wrap gap-1">
                      {profile.dietary_restrictions.map(r => (
                        <span key={r} className="px-2 py-0.5 bg-green-50 text-green-700 font-bold rounded-md border border-green-200">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#69707A]">
                  Select conditions below to personalize alerts right now, or create your permanent health profile.
                </p>
                <ConditionSelector />
              </div>
            )}
          </section>

          {/* History Shortcut */}
          <Link
            href="/history"
            className="p-5 rounded-[24px] bg-white border border-[#E5E8EC] shadow-[0_4px_30px_rgba(0,0,0,0.02)] hover:border-[#1677FF] hover:bg-[#F9FBFF] transition-all flex items-center justify-between group block"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F4F5F7] group-hover:bg-[#EAF3FF] group-hover:text-[#1677FF] text-[#69707A] flex items-center justify-center transition-colors">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#15171A]">Analysis History</h3>
                <p className="text-xs text-[#69707A]">Review past meal alerts & results</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#69707A] group-hover:text-[#1677FF] group-hover:translate-x-0.5 transition-transform" />
          </Link>

        </div>
      </div>

      {/* Daily Intake Tracker Section */}
      <section className="mt-12 pt-8 border-t border-[#E5E8EC]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-[#15171A] flex items-center gap-2.5">
              <CalendarDays className="text-[#1677FF]" size={24} /> Daily Intake Tracker
            </h2>
            <p className="text-sm text-[#69707A] mt-1 max-w-xl">
              Monitor your logged items against configured daily parameters based on your profile.
            </p>
          </div>
          <Link
            href="/tracker"
            className="text-xs font-bold text-[#1677FF] hover:underline flex items-center gap-1 bg-white px-4 py-2 rounded-full border border-[#E5E8EC] shadow-xs hover:border-[#1677FF] transition-colors"
          >
            Full View & Analytics <ChevronRight size={14} />
          </Link>
        </div>
        <DailyTracker />
      </section>
    </div>
  );
}
