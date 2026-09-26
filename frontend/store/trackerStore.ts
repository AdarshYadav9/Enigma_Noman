import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RiskLevel } from '../types';

export interface MealLog {
  id: string;
  name: string;
  sodium_mg: number;
  carbs_g: number;
  risk_level: RiskLevel;
  timestamp: string;
}

interface TrackerState {
  meals: MealLog[];
  addMeal: (meal: Omit<MealLog, 'id'>) => void;
  removeMeal: (id: string) => void;
  clearDay: () => void;
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set) => ({
      meals: [],
      addMeal: (meal) => set((state) => ({
        meals: [
          { 
            ...meal, 
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}` 
          }, 
          ...state.meals
        ]
      })),
      removeMeal: (id) => set((state) => ({
        meals: state.meals.filter((m) => m.id !== id)
      })),
      clearDay: () => set({ meals: [] }),
    }),
    {
      name: 'daily-intake-tracker-storage',
    }
  )
);
