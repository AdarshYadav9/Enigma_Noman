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
    extracted_ingredients, raw_text = extract_ingredients_from_image(req.image_base64)
    result = analyze_risk(
        ingredients=extracted_ingredients,
        conditions=req.conditions
    )
    result["ingredients_found"] = extracted_ingredients
    result["raw_text"] = raw_text
    return result

class BarcodeAnalyzeRequest(BaseModel):
    barcode: str
    conditions: List[str]

class MenuAnalyzeRequest(BaseModel):
    image_base64: str
    conditions: List[str]

@app.post("/analyze/barcode")
def analyze_barcode(req: BarcodeAnalyzeRequest):
    import httpx
    url = f"https://world.openfoodfacts.org/api/v0/product/{req.barcode}.json"
    response = httpx.get(url)
    data = response.json()
    if data.get("status") != 1:
        raise HTTPException(status_code=404, detail="Product not found")
        
    product = data["product"]
    ingredients_text = product.get("ingredients_text", "")
    if not ingredients_text:
        return analyze_risk([], req.conditions, sodium_mg=0, carbs_g=0)
        
    ingredients = [i.strip() for i in ingredients_text.split(",")]
    
    sodium_100g = product.get("nutriments", {}).get("sodium_100g", 0)
    # converting g to mg if it exists
    sodium_mg = int(float(sodium_100g) * 1000) if sodium_100g else 0
    carbs_100g = product.get("nutriments", {}).get("carbohydrates_100g", 0)
    carbs_g = int(float(carbs_100g)) if carbs_100g else 0

    return analyze_risk(
        ingredients=ingredients,
        conditions=req.conditions,
        sodium_mg=sodium_mg,
        carbs_g=carbs_g
    )

@app.post("/analyze/menu")
def analyze_menu(req: MenuAnalyzeRequest):
    _, extracted_text = extract_ingredients_from_image(req.image_base64)
    text = extracted_text
    words = text.lower().replace('\\n', ' ').split()
    
    # Match words against indian_dishes.json keys
    dishes_found = []
    avoid_dishes = []
    safest_dish = None
    safest_score = float('inf')
    
    text_clean = text.lower().replace('\n', ' ')
    
    for dish_name, dish_data in dishes_db.items():
        # simple substring match
        if dish_name in text_clean:
            result = analyze_risk(
                ingredients=dish_data["ingredients"],
                conditions=req.conditions,
                sodium_mg=dish_data["sodium_mg"],
                carbs_g=dish_data["carbs_g"]
            )
            top_flag = result["flags"][0]["ingredient"] if result["flags"] else None
            
            dishes_found.append({
                "name": dish_name,
                "risk_level": result["risk_level"],
                "top_flag": top_flag
            })
            
            if result["risk_level"] == "high":
                avoid_dishes.append(dish_name)
                score = 3
            elif result["risk_level"] == "moderate":
                score = 2
            else:
                score = 1
                
            if score < safest_score:
                safest_score = score
                safest_dish = dish_name

    return {
        "dishes_found": dishes_found,
        "safest_dish": safest_dish,
        "avoid_dishes": avoid_dishes,
        "extracted_text": text
    }

