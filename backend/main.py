from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import os

from risk_engine import analyze_risk
from ocr_service import extract_ingredients_from_image

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

base_dir = os.path.dirname(os.path.abspath(__file__))
dishes_path = os.path.join(base_dir, 'data', 'indian_dishes.json')
with open(dishes_path, 'r') as f:
    dishes_db = json.load(f)

class DishAnalyzeRequest(BaseModel):
    dish_name: str
    conditions: List[str]

class IngredientsAnalyzeRequest(BaseModel):
    ingredients: List[str]
    conditions: List[str]

class OCRAnalyzeRequest(BaseModel):
    image_base64: str
    conditions: List[str]

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/dish/search")
def search_dishes(q: str = ""):
    results = []
    q_lower = q.lower()
    for name, data in dishes_db.items():
        if q_lower in name.lower():
            results.append({
                "name": name,
                "ingredients": data["ingredients"],
                "sodium_mg": data["sodium_mg"],
                "carbs_g": data["carbs_g"]
            })
    return results

@app.post("/analyze/dish")
def analyze_dish(req: DishAnalyzeRequest):
    dish_name = req.dish_name.lower()
    if dish_name not in dishes_db:
        raise HTTPException(status_code=404, detail="Dish not found")
    
    dish_data = dishes_db[dish_name]
    result = analyze_risk(
        ingredients=dish_data["ingredients"],
        conditions=req.conditions,
        sodium_mg=dish_data["sodium_mg"],
        carbs_g=dish_data["carbs_g"]
    )
    return result

@app.post("/analyze/ingredients")
def analyze_ingredients(req: IngredientsAnalyzeRequest):
    result = analyze_risk(
        ingredients=req.ingredients,
        conditions=req.conditions
    )
    return result

@app.post("/analyze/ocr")
def analyze_ocr(req: OCRAnalyzeRequest):
    extracted_ingredients = extract_ingredients_from_image(req.image_base64)
    result = analyze_risk(
        ingredients=extracted_ingredients,
        conditions=req.conditions
    )
    result["ingredients_found"] = extracted_ingredients
    return result
