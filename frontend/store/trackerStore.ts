import { create } from 'zustand';
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
  clearDay: () => void;
}

export const useTrackerStore = create<TrackerState>((set) => ({
  meals: [],
  addMeal: (meal) => set((state) => ({
    meals: [...state.meals, { ...meal, id: Date.now().toString() }]
  })),
  clearDay: () => set({ meals: [] }),
}));
