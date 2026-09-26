import { create } from 'zustand';
import { 
  Condition, 
  RiskResult, 
  UserHealthProfile, 
  FoodSource, 
  FoodInputMode 
} from '../types';
import type { User } from 'firebase/auth';

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;

  profile: UserHealthProfile | null;
  setProfile: (profile: UserHealthProfile | null) => void;
  updateProfile: (partial: Partial<UserHealthProfile>) => void;
  clearProfile: () => void;

  selectedFoodSource: FoodSource;
  setSelectedFoodSource: (src: FoodSource) => void;

  selectedInputMode: FoodInputMode;
  setSelectedInputMode: (mode: FoodInputMode) => void;

  currentAnalysis: RiskResult | null;
  setCurrentAnalysis: (analysis: RiskResult | null) => void;
  clearCurrentAnalysis: () => void;

  // Legacy fields preserved for backward compatibility
  conditions: Condition[];
  setConditions: (c: Condition[]) => void;
  toggleCondition: (c: Condition) => void;
  result: RiskResult | null;
  setResult: (r: RiskResult | null) => void;
  isLoading: boolean;
  setLoading: (b: boolean) => void;
  dishName: string;
  setDishName: (name: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),

  profile: null,
  setProfile: (p) => set({ profile: p }),
  updateProfile: (partial) => set((state) => ({
    profile: state.profile ? { ...state.profile, ...partial } : null
  })),
  clearProfile: () => set({ profile: null }),

  selectedFoodSource: "home",
  setSelectedFoodSource: (src) => set({ selectedFoodSource: src }),

  selectedInputMode: "text",
  setSelectedInputMode: (mode) => set({ selectedInputMode: mode }),

  currentAnalysis: null,
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis, result: analysis }),
  clearCurrentAnalysis: () => set({ currentAnalysis: null, result: null }),

  // Legacy fields
  conditions: [],
  setConditions: (c) => set({ conditions: c }),
  toggleCondition: (c) => set((state) => ({
    conditions: state.conditions.includes(c)
      ? state.conditions.filter(x => x !== c)
      : [...state.conditions, c]
  })),
  result: null,
  setResult: (r) => set({ result: r, currentAnalysis: r }),
  isLoading: false,
  setLoading: (b) => set({ isLoading: b }),
  dishName: '',
  setDishName: (name) => set({ dishName: name }),
}));
