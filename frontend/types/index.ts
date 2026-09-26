export type Condition = "diabetes" | "hypertension" | "ckd" | "pcos" | "allergy";

export type RiskLevel = "high" | "moderate" | "low";

export interface RiskFlag {
  ingredient: string;
  risk_level: RiskLevel;
  condition: string;
  reason: string;
}

export interface RiskResult {
  risk_level: RiskLevel;
  flags: RiskFlag[];
  explanation: string;
  hidden_alerts: { term: string; meaning: string }[];
  sodium_warning: string | null;
  safe_ingredients: string[];
  ingredients_found?: string[];
  raw_text?: string;
}

export interface Dish {
  name: string;
  ingredients: string[];
  sodium_mg: number;
  carbs_g: number;
}

export interface MenuDish {
  name: string;
  risk_level: RiskLevel;
  top_flag: string | null;
}

export interface MenuAnalysis {
  dishes_found: MenuDish[];
  safest_dish: string | null;
  avoid_dishes: string[];
}
