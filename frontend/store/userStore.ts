import { create } from 'zustand';
import { Condition, RiskResult } from '../types';
import type { User } from 'firebase/auth';

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
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
  user: null,
  setUser: (u) => set({ user: u }),
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
