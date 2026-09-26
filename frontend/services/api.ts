import { Dish, RiskResult } from '../types';

const BASE = "http://localhost:8000";

export async function searchDishes(q: string): Promise<Dish[]> {
  const res = await fetch(`${BASE}/dish/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function analyzeDish(dish_name: string, conditions: string[]): Promise<RiskResult> {
  const res = await fetch(`${BASE}/analyze/dish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dish_name, conditions })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function analyzeIngredients(ingredients: string[], conditions: string[]): Promise<RiskResult> {
  const res = await fetch(`${BASE}/analyze/ingredients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients, conditions })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function analyzeOCR(image_base64: string, conditions: string[]): Promise<RiskResult> {
  const res = await fetch(`${BASE}/analyze/ocr`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64, conditions })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function analyzeBarcode(barcode: string, conditions: string[]): Promise<RiskResult> {
  const res = await fetch(`${BASE}/analyze/barcode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ barcode, conditions })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function analyzeMenu(image_base64: string, conditions: string[]): Promise<any> {
  const res = await fetch(`${BASE}/analyze/menu`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64, conditions })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
