"use client";

import ConditionSelector from '../components/ConditionSelector';
import DishSearch from '../components/DishSearch';
import { useUserStore } from '../store/userStore';

export default function Home() {
  const { conditions } = useUserStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-12">
        
        <header className="text-center space-y-4">
          <div className="inline-block bg-white p-4 rounded-full shadow-sm mb-2 border border-red-100">
            <span className="text-4xl">🩺</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Health Track
          </h1>
          <p className="text-xl text-gray-600">Know what's really in your food</p>
          <div className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium">
            Built for diabetes, hypertension, CKD, PCOS patients
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
            Select Your Conditions
          </h2>
          <ConditionSelector />
        </section>

        {conditions.length > 0 && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              What Are You Eating?
            </h2>
            <DishSearch />
          </section>
        )}
      </div>
    </div>
  );
}
