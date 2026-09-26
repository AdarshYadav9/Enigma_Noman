import { create } from 'zustand';
import { Condition, RiskResult } from '../types';

interface UserState {
  conditions: Condition[];
  setConditions: (c: Condition[]) => void;
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
  result: null,
  setResult: (r) => set({ result: r }),
  isLoading: false,
  setLoading: (b) => set({ isLoading: b }),
  dishName: '',
  setDishName: (name) => set({ dishName: name }),
}));
