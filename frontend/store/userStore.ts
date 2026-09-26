import { create } from 'zustand';
import { Condition, RiskResult } from '../types';

interface UserState {
  conditions: Condition[];
  setConditions: (c: Condition[]) => void;
  toggleCondition: (c: Condition) => void;
  result: RiskResult | null;
  setResult: (r: RiskResult) => void;
  isLoading: boolean;
  setLoading: (b: boolean) => void;
  dishName: string;
  setDishName: (name: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  conditions: [],
  setConditions: (c) => set({ conditions: c }),
  toggleCondition: (c) => set((state) => ({
    conditions: state.conditions.includes(c)
      ? state.conditions.filter(x => x !== c)
      : [...state.conditions, c]
  })),
  result: null,
  setResult: (r) => set({ result: r }),
  isLoading: false,
  setLoading: (b) => set({ isLoading: b }),
  dishName: '',
  setDishName: (name) => set({ dishName: name }),
}));
