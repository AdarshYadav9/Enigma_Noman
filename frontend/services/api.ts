import { 
  Dish, 
  MenuAnalysis, 
  RiskResult, 
  UserHealthProfile, 
  FoodSource, 
  FoodAnalysisHistoryItem,
  VoiceAnalysisResponse 
} from '../types';
import { auth } from '../lib/firebase';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/**
 * Retrieves the verified Firebase Bearer token for authenticated requests.
 * Throws an error if the user is not authenticated.
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Please sign in to access personalized dietary features.');
  }
  const token = await currentUser.getIdToken();
  return {
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Optional authentication headers for endpoints that can benefit from profile context
 * but don't strictly require authentication.
 */
export async function getOptionalAuthHeaders(): Promise<HeadersInit> {
  const currentUser = auth.currentUser;
  if (!currentUser) return {};
  try {
    const token = await currentUser.getIdToken();
    return { 'Authorization': `Bearer ${token}` };
  } catch {
    return {};
  }
}

async function readError(res: Response): Promise<string> {
  const body = await res.text().catch(() => '');
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === 'object') {
      if ('detail' in parsed) {
        const detail = (parsed as { detail: unknown }).detail;
        if (typeof detail === 'string') return detail;
        if (typeof detail === 'object' && detail !== null && 'message' in detail) {
          return String((detail as { message: unknown }).message);
        }
      }
      if ('message' in parsed && typeof (parsed as { message: unknown }).message === 'string') {
        return (parsed as { message: string }).message;
      }
    }
  } catch {
    // Non-JSON response, fall through
  }

  if (res.status === 401) return 'Your session has expired. Please sign in again.';
  if (res.status === 404) return 'The requested item or product was not found.';
  if (res.status === 422) return 'Please check the entered information.';
  if (res.status === 502) return 'External food or voice service is temporarily unavailable.';
  return body || `Request failed (${res.status})`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, init);
  } catch {
    throw new Error('Cannot reach the analysis service. Please make sure the backend is running.');
  }
  if (!res.ok) throw new Error(await readError(res));
  return res.json() as Promise<T>;
}

export function getErrorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

/**
 * Normalizes backend response formats (both unified StandardFoodResponse and legacy risk response)
 * into the standard frontend RiskResult type.
 */
export function mapFoodAnalysisResponse(raw: any): RiskResult {
  if (!raw) {
    return {
      risk_level: "unknown",
      explanation: "No analysis data returned.",
      flags: [],
      safe_ingredients: [],
      hidden_alerts: []
    };
  }

  // Handle new unified StandardFoodResponse
  if (raw.food || raw.risk) {
    const foodObj = raw.food || {};
    const riskObj = raw.risk || {};

    const flags = (raw.findings || []).map((f: any) => ({
      ingredient: f.ingredient || "",
      risk_level: f.risk_level || "moderate",
      condition: f.condition || "",
      reason: f.reason || ""
    }));

    const hiddenAlerts = (raw.ambiguous_terms || []).map((a: any) => ({
      term: a.term || "",
      meaning: a.message || "Ingredient composition is not fully specified."
    }));

    const rawScore = riskObj.score ?? raw.risk_score;
    const computedScore = (rawScore !== undefined && rawScore !== null)
      ? rawScore
      : (riskObj.level === "high" || raw.risk_level === "high") ? 75
      : (riskObj.level === "moderate" || raw.risk_level === "moderate") ? 40
      : (riskObj.level === "low" || raw.risk_level === "low") ? 10
      : (raw.status === "unknown" ? null : 15);

    return {
      status: raw.status || "success",
      reason: raw.reason || null,
      food_name: foodObj.name || raw.food_name || "Food Item",
      normalized_name: foodObj.normalized_name || null,
      food_source: foodObj.source || "home",
      input_mode: foodObj.input_mode || "text",
      confidence: raw.confidence || null,
      risk_level: riskObj.level || raw.risk_level || "unknown",
      risk_score: computedScore,
      risk_label: riskObj.label || raw.risk_label || "Rule-based dietary risk indicator",
      explanation: raw.explanation || (raw.message ? raw.message : "Dietary assessment complete."),
      flags: flags,
      findings: raw.findings || [],
      allergy_conflicts: raw.allergy_conflicts || [],
      nutrition: raw.nutrition || {},
      nutrition_flags: raw.nutrition_flags || [],
      safe_ingredients: raw.safe_items || raw.safe_ingredients || [],
      hidden_alerts: hiddenAlerts,
      ambiguous_terms: raw.ambiguous_terms || [],
      alternatives: raw.alternatives || [],
      alternative_message: raw.alternative_message || null,
      uncertainty: raw.uncertainty || [],
      user_context: raw.user_context || undefined,
      disclaimer: raw.disclaimer || undefined
    };
  }

  // Legacy format fallback
  const rawScore = raw.risk_score ?? raw.risk?.score;
  const legacyScore = (rawScore !== undefined && rawScore !== null)
    ? rawScore
    : raw.risk_level === "high" ? 75
    : raw.risk_level === "moderate" ? 40
    : raw.risk_level === "low" ? 10
    : null;

  return {
    status: raw.status || "success",
    food_name: raw.food_name || "Packaged Product",
    food_source: raw.food_source || "packaged",
    input_mode: raw.input_mode || "image",
    risk_level: raw.risk_level || "unknown",
    risk_score: legacyScore,
    risk_label: raw.risk_label || "Rule-based dietary risk indicator",
    flags: raw.flags || [],
    findings: raw.findings || raw.flags || [],
    explanation: raw.explanation || "Dietary assessment complete.",
    hidden_alerts: raw.hidden_alerts || [],
    sodium_warning: raw.sodium_warning || null,
    safe_ingredients: raw.safe_ingredients || [],
    ingredients_found: raw.ingredients_found || [],
    raw_text: raw.raw_text || undefined,
    nutrition: raw.nutrition || {}
  };
}

// ----------------------------------------------------------------------------
// User Profile API
// ----------------------------------------------------------------------------
export async function getProfile(): Promise<UserHealthProfile> {
  const authHeaders = await getAuthHeaders();
  return request<UserHealthProfile>('/profile', {
    headers: authHeaders
  });
}

export async function createProfile(data: Partial<UserHealthProfile>): Promise<UserHealthProfile> {
  const authHeaders = await getAuthHeaders();
  return request<UserHealthProfile>('/profile', {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

export async function updateProfile(data: Partial<UserHealthProfile>): Promise<UserHealthProfile> {
  const authHeaders = await getAuthHeaders();
  return request<UserHealthProfile>('/profile', {
    method: 'PUT',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

export async function deleteProfile(): Promise<{ status: string; deleted: boolean }> {
  const authHeaders = await getAuthHeaders();
  return request<{ status: string; deleted: boolean }>('/profile', {
    method: 'DELETE',
    headers: authHeaders
  });
}

// ----------------------------------------------------------------------------
// Unified Personalized Food Analysis API
// ----------------------------------------------------------------------------
export async function analyzeFood(payload: {
  food_name?: string;
  food_source?: FoodSource;
  input_mode?: string;
  ingredients?: string[];
  nutrition?: Record<string, any>;
  barcode?: string;
}): Promise<RiskResult> {
  const authHeaders = await getAuthHeaders();
  const raw = await request<any>('/food/analyze', {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      food_name: payload.food_name || (payload.barcode ? "Packaged Product" : "Food Item"),
      food_source: payload.food_source || 'home',
      input_mode: payload.input_mode || (payload.barcode ? 'barcode' : 'text'),
      ingredients: payload.ingredients || null,
      nutrition: payload.nutrition || null,
      barcode: payload.barcode || null
    })
  });
  return mapFoodAnalysisResponse(raw);
}

export async function analyzeVoice(
  audioBlob: Blob,
  foodSource: FoodSource = 'home'
): Promise<VoiceAnalysisResponse> {
  const authHeaders = await getAuthHeaders();
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');
  formData.append('food_source', foodSource);

  const raw = await request<any>('/food/voice', {
    method: 'POST',
    headers: {
      ...authHeaders
    },
    body: formData
  });

  return {
    status: raw.status || 'success',
    transcript: raw.transcript || '',
    food_name: raw.food_name || null,
    food_source: raw.food_source || foodSource,
    confidence: raw.confidence || 0,
    analysis: raw.analysis ? mapFoodAnalysisResponse(raw.analysis) : null,
    message: raw.message,
    reason: raw.reason
  };
}

export async function getFoodAlternatives(
  foodName: string,
  foodSource: FoodSource = 'home'
): Promise<{ food_name: string; alternatives: any[]; alternative_message: string | null }> {
  const authHeaders = await getAuthHeaders();
  return request<any>('/food/alternative', {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      food_name: foodName,
      food_source: foodSource
    })
  });
}

// ----------------------------------------------------------------------------
// Food Analysis History API
// ----------------------------------------------------------------------------
export async function getFoodHistory(
  limit: number = 20,
  offset: number = 0
): Promise<{ history: FoodAnalysisHistoryItem[]; limit: number; offset: number }> {
  const authHeaders = await getAuthHeaders();
  return request<any>(`/food/history?limit=${limit}&offset=${offset}`, {
    headers: authHeaders
  });
}

export async function getFoodHistoryItem(analysisId: string): Promise<FoodAnalysisHistoryItem> {
  const authHeaders = await getAuthHeaders();
  return request<FoodAnalysisHistoryItem>(`/food/history/${analysisId}`, {
    headers: authHeaders
  });
}

// ----------------------------------------------------------------------------
// Legacy Endpoints (Preserved with Optional Profile Headers)
// ----------------------------------------------------------------------------
export function searchDishes(q: string): Promise<Dish[]> {
  return request<Dish[]>(`/dish/search?q=${encodeURIComponent(q)}`);
}

export async function analyzeDish(dish_name: string, conditions: string[]): Promise<RiskResult> {
  const optHeaders = await getOptionalAuthHeaders();
  const raw = await request<any>('/analyze/dish', {
    method: 'POST',
    headers: {
      ...optHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ dish_name, conditions })
  });
  return mapFoodAnalysisResponse(raw);
}

export async function analyzeIngredients(ingredients: string[], conditions: string[]): Promise<RiskResult> {
  const optHeaders = await getOptionalAuthHeaders();
  const raw = await request<any>('/analyze/ingredients', {
    method: 'POST',
    headers: {
      ...optHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ingredients, conditions })
  });
  return mapFoodAnalysisResponse(raw);
}

export async function analyzeOCR(image_base64: string, conditions: string[]): Promise<RiskResult> {
  const optHeaders = await getOptionalAuthHeaders();
  const raw = await request<any>('/analyze/ocr', {
    method: 'POST',
    headers: {
      ...optHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ image_base64, conditions })
  });
  return mapFoodAnalysisResponse(raw);
}

export async function analyzeBarcode(barcode: string, conditions: string[]): Promise<RiskResult> {
  const optHeaders = await getOptionalAuthHeaders();
  const raw = await request<any>('/analyze/barcode', {
    method: 'POST',
    headers: {
      ...optHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ barcode, conditions })
  });
  return mapFoodAnalysisResponse(raw);
}

export async function analyzeMenu(image_base64: string, conditions: string[]): Promise<MenuAnalysis> {
  const optHeaders = await getOptionalAuthHeaders();
  return request<MenuAnalysis>('/analyze/menu', {
    method: 'POST',
    headers: {
      ...optHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ image_base64, conditions })
  });
}
