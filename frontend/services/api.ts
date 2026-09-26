import { Dish, MenuAnalysis, RiskResult } from '../types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function readError(res: Response): Promise<string> {
  const body = await res.text().catch(() => '');
  try {
    const parsed: unknown = JSON.parse(body);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'detail' in parsed &&
      typeof (parsed as { detail: unknown }).detail === 'string'
    ) {
      return (parsed as { detail: string }).detail;
    }
  } catch {
    // body was not JSON, fall through to raw text
  }
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

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export function getErrorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

export function searchDishes(q: string): Promise<Dish[]> {
  return request<Dish[]>(`/dish/search?q=${encodeURIComponent(q)}`);
}

export function analyzeDish(dish_name: string, conditions: string[]): Promise<RiskResult> {
  return request<RiskResult>('/analyze/dish', json({ dish_name, conditions }));
}

export function analyzeIngredients(ingredients: string[], conditions: string[]): Promise<RiskResult> {
  return request<RiskResult>('/analyze/ingredients', json({ ingredients, conditions }));
}

export function analyzeOCR(image_base64: string, conditions: string[]): Promise<RiskResult> {
  return request<RiskResult>('/analyze/ocr', json({ image_base64, conditions }));
}

export function analyzeBarcode(barcode: string, conditions: string[]): Promise<RiskResult> {
  return request<RiskResult>('/analyze/barcode', json({ barcode, conditions }));
}

export function analyzeMenu(image_base64: string, conditions: string[]): Promise<MenuAnalysis> {
  return request<MenuAnalysis>('/analyze/menu', json({ image_base64, conditions }));
}
