export type Condition = "diabetes" | "hypertension" | "ckd" | "pcos" | "allergy";

export type FoodSource = "packaged" | "home" | "restaurant";

export type FoodInputMode = "text" | "voice" | "barcode" | "image" | "menu";

export type RiskLevel = "high" | "moderate" | "low" | "unknown";

export interface UserHealthProfile {
  id?: string;
  firebase_uid?: string;
  age?: number | null;
  height_cm?: number | null;
  allergies: string[];
  conditions: string[];
  diseases: string[];
  health_issues: string[];
  dietary_restrictions: string[];
  health_restrictions: string[];
  doctor_advised_restrictions: string[];
  nutrition_thresholds?: {
    sodium_mg?: number;
    carbs_g?: number;
    sugar_g?: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface RiskFlag {
  ingredient: string;
  risk_level: RiskLevel;
  condition: string;
  reason: string;
}

export interface RiskFinding {
  type: string; // "condition" | "restriction" | "nutrition"
  condition?: string | null;
  ingredient?: string | null;
  risk_level?: RiskLevel | null;
  reason: string;
}

export interface AllergyConflict {
  allergen: string;
  matched_ingredient: string;
  severity: string;
}

export interface NutritionFlag {
  nutrient: string;
  value: number;
  unit: string;
  limit?: number;
  status: string; // "high_for_profile" | "moderate_for_profile"
  reason: string;
}

export interface AlternativeFood {
  name: string;
  risk_level: RiskLevel;
  reason: string;
}

export interface ConfidenceResult {
  food_identification: number;
  ingredient_information: number;
  overall: number;
}

export interface FoodIdentity {
  name: string | null;
  normalized_name?: string | null;
  source: FoodSource;
  input_mode: FoodInputMode;
  confidence: number;
}

export interface RiskResult {
  food_name?: string;
  normalized_name?: string | null;
  food_source?: FoodSource;
  input_mode?: FoodInputMode;
  confidence?: ConfidenceResult | null;
  risk_level: RiskLevel;
  risk_score?: number | null;
  risk_label?: string;
  explanation: string;
  flags: RiskFlag[];
  findings?: RiskFinding[];
  allergy_conflicts?: AllergyConflict[];
  nutrition?: Record<string, any>;
  nutrition_flags?: NutritionFlag[];
  safe_ingredients: string[];
  hidden_alerts: { term: string; meaning: string }[];
  ambiguous_terms?: { term: string; message: string }[];
  alternatives?: AlternativeFood[];
  alternative_message?: string | null;
  uncertainty?: string[];
  user_context?: {
    conditions_considered: string[];
    allergies_considered: string[];
    restrictions_considered: string[];
  };
  sodium_warning?: string | null;
  ingredients_found?: string[];
  raw_text?: string;
  status?: string;
  reason?: string | null;
  disclaimer?: string;
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

export interface FoodAnalysisHistoryItem {
  id: string;
  firebase_uid: string;
  input_mode: FoodInputMode;
  food_source: FoodSource;
  food_name: string | null;
  normalized_food_name: string | null;
  confidence: number;
  risk_level: RiskLevel;
  risk_score: number | null;
  result_json: RiskResult;
  source_image_path?: string | null;
  created_at: string;
}

export interface VoiceAnalysisResponse {
  status: string;
  transcript: string;
  food_name: string | null;
  food_source: FoodSource;
  confidence: number;
  analysis: RiskResult | null;
  message?: string;
  reason?: string;
}

export interface APIError {
  status: string;
  service?: string;
  message: string;
}
