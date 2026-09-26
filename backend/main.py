import base64
import os
import re
import json
from io import BytesIO
from typing import List, Optional, Dict, Any
from PIL import Image
import pytesseract
import httpx

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Authentication & Config
from auth.firebase_auth import get_current_user, get_optional_current_user
from config import OPENFOODFACTS_BASE_URL, logger

# Repositories & Database
from db.repositories import (
    get_profile_by_firebase_uid,
    create_or_update_profile,
    delete_profile,
    get_food_history,
    get_food_history_item
)

# Models
from models.profile_models import ProfileCreate, ProfileUpdate, ProfileResponse
from models.food_models import FoodAnalyzeRequest, AlternativeRequest
from models.response_models import StandardFoodResponse

# Services & Engine
from services.pipeline_service import analyze_food_for_user
from services.food_service import get_dishes_db, normalize_food_name, resolve_food_alias
from services.alternative_service import get_personalized_alternatives
from services.sarvam_service import transcribe_audio_sarvam, extract_food_phrase
from risk_engine import analyze_risk
from risk_config import STANDARD_DISCLAIMER
from ocr_service import extract_ingredients_from_image, extract_label_details

app = FastAPI(
    title="Personalized Dietary Risk Alert System API",
    version="2.0.0",
    description="FastAPI backend providing personalized dietary risk alerts, OCR, Barcode, Voice analysis, and safe food alternatives."
)

# Configure CORS for development and production
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_raw:
    origins = [orig.strip() for orig in allowed_origins_raw.split(",") if orig.strip()]
else:
    origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://.*" if os.getenv("ALLOW_ALL_ORIGINS", "").lower() == "true" else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

dishes_db = get_dishes_db()

# -----------------------------------------------------------------------------
# System & Diagnostic Endpoints
# -----------------------------------------------------------------------------
@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": "2.0.0"}

@app.get("/dish/search", tags=["Dishes"])
def search_dishes(q: str = Query("", description="Query string to search in dish names")):
    """Search known Indian dishes by name substring."""
    results = []
    q_lower = q.lower().strip()
    for name, data in dishes_db.items():
        if q_lower in name.lower():
            results.append({
                "name": name,
                "ingredients": data["ingredients"],
                "sodium_mg": data["sodium_mg"],
                "carbs_g": data["carbs_g"]
            })
    return results

# -----------------------------------------------------------------------------
# User Health Profile Endpoints (Authenticated)
# -----------------------------------------------------------------------------
@app.get("/profile", response_model=ProfileResponse, tags=["Profile"])
async def get_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve the health profile for the authenticated user."""
    uid = current_user["uid"]
    profile = get_profile_by_firebase_uid(uid)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health profile not found for this user."
        )
    return profile

@app.post("/profile", response_model=ProfileResponse, tags=["Profile"])
async def create_user_profile(
    profile_data: ProfileCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create health profile for the authenticated user."""
    uid = current_user["uid"]
    created = create_or_update_profile(uid, profile_data.model_dump())
    return created

@app.put("/profile", response_model=ProfileResponse, tags=["Profile"])
async def update_user_profile(
    profile_data: ProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update health profile for the authenticated user."""
    uid = current_user["uid"]
    updated = create_or_update_profile(uid, profile_data.model_dump(exclude_unset=True))
    return updated

@app.delete("/profile", tags=["Profile"])
async def remove_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Delete health profile for the authenticated user."""
    uid = current_user["uid"]
    success = delete_profile(uid)
    return {"status": "success", "deleted": success}

# -----------------------------------------------------------------------------
# Unified Food Analysis Endpoints (Authenticated)
# -----------------------------------------------------------------------------
@app.post("/food/analyze", response_model=StandardFoodResponse, tags=["Food Analysis"])
async def analyze_food_text(
    req: FoodAnalyzeRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Analyzes food input (text/home/restaurant) against the authenticated user's health profile.
    """
    uid = current_user["uid"]
    result = analyze_food_for_user(
        firebase_uid=uid,
        food_name=req.food_name,
        food_source=req.food_source,
        input_mode="text",
        ingredients=req.ingredients,
        nutrition=req.nutrition,
        raw_confidence=1.0
    )
    return result

@app.post("/food/voice", tags=["Food Analysis"])
async def analyze_food_voice(
    audio: UploadFile = File(..., description="Audio recording file (wav, mp3, m4a, webm)"),
    food_source: str = Form("home", description="Food source ('home', 'restaurant', or 'packaged')"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Transcribes spoken food input using Sarvam AI (saaras:v3) and executes personalized risk analysis.
    """
    uid = current_user["uid"]

    # 1. Transcribe audio
    transcript, error = await transcribe_audio_sarvam(audio)
    if error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY if error.get("status") == "external_api_error" else status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=error
        )

    # 2. Extract food item phrase from transcript
    food_phrase, confidence, detected_source = extract_food_phrase(transcript)
    effective_source = detected_source or food_source or "home"

    if not food_phrase or confidence < 0.35:
        return {
            "status": "unknown",
            "transcript": transcript,
            "food_name": None,
            "food_source": effective_source,
            "confidence": round(confidence, 2),
            "message": "I’m not sure about the food item.",
            "reason": "The spoken input could not be confidently mapped to a known food.",
            "analysis": None
        }

    # 3. Analyze through unified pipeline
    analysis = analyze_food_for_user(
        firebase_uid=uid,
        food_name=food_phrase,
        food_source=effective_source,
        input_mode="voice",
        raw_confidence=confidence
    )

    return {
        "status": "success",
        "transcript": transcript,
        "food_name": food_phrase,
        "food_source": effective_source,
        "confidence": round(confidence, 2),
        "analysis": analysis
    }

@app.post("/food/alternative", tags=["Food Analysis"])
async def get_food_alternatives(
    req: AlternativeRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Generates personalized healthier food alternatives for high-risk dishes,
    filtered to remove any candidate conflicting with the user's health profile.
    """
    uid = current_user["uid"]
    profile = get_profile_by_firebase_uid(uid)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Please complete your health profile first."
        )

    alternatives, message = get_personalized_alternatives(
        food_name=req.food_name,
        user_profile=profile
    )

    return {
        "food_name": req.food_name,
        "alternatives": alternatives,
        "alternative_message": message
    }

# -----------------------------------------------------------------------------
# Food Analysis History Endpoints (Authenticated)
# -----------------------------------------------------------------------------
@app.get("/food/history", tags=["History"])
async def list_food_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """List paginated food risk analysis history for the authenticated user."""
    uid = current_user["uid"]
    history = get_food_history(uid, limit=limit, offset=offset)
    return {"history": history, "limit": limit, "offset": offset}

@app.get("/food/history/{analysis_id}", tags=["History"])
async def get_food_history_detail(
    analysis_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Retrieve full details of a specific past food analysis for the authenticated user."""
    uid = current_user["uid"]
    item = get_food_history_item(uid, analysis_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History record not found."
        )
    return item

# -----------------------------------------------------------------------------
# Backward-Compatible Endpoints (Preserving Existing Functionality)
# -----------------------------------------------------------------------------
class DishAnalyzeRequest(BaseModel):
    dish_name: str
    conditions: List[str]

class IngredientsAnalyzeRequest(BaseModel):
    ingredients: List[str]
    conditions: List[str]

class OCRAnalyzeRequest(BaseModel):
    image_base64: str
    conditions: List[str]

class BarcodeAnalyzeRequest(BaseModel):
    barcode: str
    conditions: List[str]

class MenuAnalyzeRequest(BaseModel):
    image_base64: str
    conditions: List[str]

@app.post("/analyze/dish", tags=["Backward Compatibility"])
def legacy_analyze_dish(
    req: DishAnalyzeRequest,
    opt_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    """Legacy dish analysis endpoint."""
    dish_name = req.dish_name.lower().strip()
    if dish_name not in dishes_db:
        # Check alias lookup
        canonical, conf = resolve_food_alias(dish_name)
        if canonical and canonical in dishes_db:
            dish_name = canonical
        else:
            raise HTTPException(status_code=404, detail="Dish not found")
    
    dish_data = dishes_db[dish_name]

    # Incorporate user profile conditions if authenticated
    conditions = list(req.conditions)
    if opt_user:
        profile = get_profile_by_firebase_uid(opt_user["uid"])
        if profile:
            for c in profile.get("conditions", []):
                if c not in conditions:
                    conditions.append(c)

    result = analyze_risk(
        ingredients=dish_data["ingredients"],
        conditions=conditions,
        sodium_mg=dish_data["sodium_mg"],
        carbs_g=dish_data["carbs_g"]
    )
    return result

@app.post("/analyze/ingredients", tags=["Backward Compatibility"])
def legacy_analyze_ingredients(
    req: IngredientsAnalyzeRequest,
    opt_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    """Legacy ingredients analysis endpoint."""
    conditions = list(req.conditions)
    if opt_user:
        profile = get_profile_by_firebase_uid(opt_user["uid"])
        if profile:
            for c in profile.get("conditions", []):
                if c not in conditions:
                    conditions.append(c)

    result = analyze_risk(
        ingredients=req.ingredients,
        conditions=conditions
    )
    return result

@app.post("/analyze/ocr", tags=["Backward Compatibility"])
def legacy_analyze_ocr(
    req: OCRAnalyzeRequest,
    opt_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    """OCR ingredient analysis endpoint integrating preprocessing, nutrition, and personalized analysis."""
    from ocr_service import extract_label_details
    product_name, extracted_ingredients, nutrition, raw_text = extract_label_details(req.image_base64)
    uid = opt_user["uid"] if opt_user else None

    # If ingredients or nutrition were found, analyze through the personalized pipeline
    if extracted_ingredients or nutrition:
        resolved_name = product_name or "Packaged Product"
        fallback = {"conditions": req.conditions, "allergies": [], "dietary_restrictions": [], "health_restrictions": []} if req.conditions else None
        analysis = analyze_food_for_user(
            firebase_uid=uid,
            food_name=resolved_name,
            food_source="packaged",
            input_mode="image",
            ingredients=extracted_ingredients if extracted_ingredients else None,
            nutrition=nutrition if nutrition else None,
            raw_confidence=0.88,
            fallback_profile=fallback
        )
        
        # Merge legacy keys for complete backward compatibility
        analysis["ingredients_found"] = extracted_ingredients
        analysis["raw_text"] = raw_text
        risk_obj = analysis.get("risk", {})
        analysis["risk_level"] = risk_obj.get("level", analysis.get("risk_level", "low"))
        analysis["risk_score"] = risk_obj.get("score", 0)
        analysis["risk_label"] = risk_obj.get("label", "Rule-based dietary risk indicator")
        if "safe_items" in analysis and "safe_ingredients" not in analysis:
            analysis["safe_ingredients"] = analysis["safe_items"]
        if "findings" in analysis and "flags" not in analysis:
            analysis["flags"] = [
                {
                    "ingredient": f.get("ingredient", ""),
                    "risk_level": f.get("risk_level", "moderate"),
                    "condition": f.get("condition", ""),
                    "reason": f.get("reason", "")
                }
                for f in analysis.get("findings", [])
            ]
        return analysis
    else:
        # Unknown state: no readable ingredients found on the uploaded image
        return {
            "status": "unknown",
            "message": "We couldn't read the ingredient list clearly from this image.",
            "reason": "No readable ingredient list or food composition was detected. Please ensure the label is well-lit, sharp, and clearly legible.",
            "food": {
                "name": product_name or "Packaged Label",
                "normalized_name": None,
                "source": "packaged",
                "input_mode": "image",
                "confidence": 0.1
            },
            "risk": {
                "level": "unknown",
                "score": None,
                "label": "Unknown Dietary Risk"
            },
            "findings": [],
            "allergy_conflicts": [],
            "nutrition": {},
            "nutrition_flags": [],
            "safe_items": [],
            "safe_ingredients": [],
            "ingredients_found": [],
            "raw_text": raw_text,
            "ambiguous_terms": [],
            "alternatives": [],
            "uncertainty": [
                "The image was too blurry, obscured, or lacked an ingredient section.",
                "Try scanning the barcode or re-taking a sharper, well-lit photo."
            ],
            "confidence": {
                "food_identification": 0.1,
                "ingredient_information": 0.0,
                "overall": 0.05
            },
            "explanation": "Unable to assess dietary risk because no ingredients could be extracted from the uploaded image.",
            "disclaimer": STANDARD_DISCLAIMER
        }

@app.post("/analyze/barcode", tags=["Backward Compatibility"])
def legacy_analyze_barcode(
    req: BarcodeAnalyzeRequest,
    opt_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    """Legacy barcode lookup and OpenFoodFacts analysis endpoint with timeout."""
    url = f"{OPENFOODFACTS_BASE_URL}/api/v0/product/{req.barcode}.json"
    try:
        with httpx.Client(timeout=8.0) as client:
            response = client.get(url)
            data = response.json()
    except Exception as e:
        logger.error(f"OpenFoodFacts lookup failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"status": "external_api_error", "service": "openfoodfacts"}
        )

    if data.get("status") != 1:
        return {
            "product_found": False,
            "fallback": "ocr_recommended",
            "message": "Product not found in OpenFoodFacts database."
        }
        
    product = data.get("product", {})
    ingredients_text = product.get("ingredients_text", "")
    
    sodium_100g = product.get("nutriments", {}).get("sodium_100g", 0)
    sodium_mg = int(float(sodium_100g) * 1000) if sodium_100g else 0
    carbs_100g = product.get("nutriments", {}).get("carbohydrates_100g", 0)
    carbs_g = int(float(carbs_100g)) if carbs_100g else 0

    if not ingredients_text:
        res = analyze_risk([], req.conditions, sodium_mg=sodium_mg, carbs_g=carbs_g)
        res["food_source"] = "packaged"
        res["product_found"] = True
        res["product_name"] = product.get("product_name", "Packaged Product")
        res["ingredients_available"] = False
        res["nutrition_available"] = bool(sodium_mg or carbs_g)
        return res
        
    ingredients = [i.strip() for i in ingredients_text.split(",") if i.strip()]
    
    conditions = list(req.conditions)
    if opt_user:
        profile = get_profile_by_firebase_uid(opt_user["uid"])
        if profile:
            for c in profile.get("conditions", []):
                if c not in conditions:
                    conditions.append(c)

    res = analyze_risk(
        ingredients=ingredients,
        conditions=conditions,
        sodium_mg=sodium_mg,
        carbs_g=carbs_g
    )
    res["food_source"] = "packaged"
    res["product_found"] = True
    res["product_name"] = product.get("product_name", "Packaged Product")
    res["ingredients_available"] = True
    res["nutrition_available"] = True
    return res

@app.post("/analyze/menu", tags=["Backward Compatibility"])
def legacy_analyze_menu(
    req: MenuAnalyzeRequest,
    opt_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    """Legacy menu OCR dish matching endpoint with multi-pass OCR and alias matching."""
    from ocr_service import preprocess_image
    from PIL import ImageOps, ImageEnhance
    from services.food_service import resolve_food_alias, normalize_food_name, _food_aliases
    from risk_engine import check_allergies
    
    text = ""
    try:
        image = preprocess_image(req.image_base64)
        # Pass 1: Standard automatic layout
        text = pytesseract.image_to_string(image, config='--oem 3 --psm 3')
        
        # Pass 2: Try psm 6 (uniform block of text, great for multi-item menus)
        if len(text.strip()) < 30:
            text_p6 = pytesseract.image_to_string(image, config='--oem 3 --psm 6')
            if len(text_p6.strip()) > len(text.strip()):
                text = text_p6
                
        # Pass 3: Grayscale + high contrast if still short
        if len(text.strip()) < 30:
            gray = ImageOps.grayscale(image)
            enhanced = ImageEnhance.Contrast(gray).enhance(2.0)
            text_pass3 = pytesseract.image_to_string(enhanced, config='--oem 3 --psm 6')
            if len(text_pass3.strip()) > len(text.strip()):
                text = text_pass3
    except Exception as e:
        logger.error(f"Menu OCR processing failed: {e}")
        text = ""

    text_lower = text.lower()
    conditions = [c.strip() for c in req.conditions if c and c.strip()]
    user_allergies: List[str] = []

    if opt_user:
        profile = get_profile_by_firebase_uid(opt_user["uid"])
        if profile:
            for c in profile.get("conditions", []):
                if c not in conditions:
                    conditions.append(c)
            user_allergies = profile.get("allergies", [])

    matched_dishes = set()
    current_db = get_dishes_db()

    # 1. Direct canonical names search
    for dish_name in current_db.keys():
        if dish_name in text_lower:
            matched_dishes.add(dish_name)

    # 2. Alias dictionary search across full OCR text
    for canonical, aliases in _food_aliases.items():
        if canonical in current_db:
            for alias in aliases:
                # Word boundary check or substring if long enough
                if len(alias) >= 4 and alias.lower() in text_lower:
                    matched_dishes.add(canonical)
                    break

    # 3. Line-by-line item extraction (strips prices, numbers, bullet points)
    lines = text.split("\n")
    for line in lines:
        cleaned_line = line.strip()
        if not cleaned_line or len(cleaned_line) < 3:
            continue
        # Remove price patterns like Rs. 250, ₹150, 250/-, 99.00
        stripped = re.sub(r'(?:rs\.?|inr|₹)\s*\d+(?:\.\d+)?', '', cleaned_line, flags=re.I)
        stripped = re.sub(r'\b\d+(?:\.\d+)?(?:\s*/-|\s*rs)?\b', '', stripped, flags=re.I)
        stripped = re.sub(r'^[\d\.\-\*\•\)\(]+\s*', '', stripped)
        norm = normalize_food_name(stripped)
        if len(norm) >= 3:
            canonical, conf = resolve_food_alias(norm)
            if canonical and conf >= 0.70 and canonical in current_db:
                matched_dishes.add(canonical)

    dishes_found = []
    avoid_dishes = []
    safest_dish = None
    safest_score = float('inf')

    for dish_name in matched_dishes:
        dish_data = current_db.get(dish_name)
        if not dish_data:
            continue

        result = analyze_risk(
            ingredients=dish_data["ingredients"],
            conditions=conditions,
            sodium_mg=dish_data.get("sodium_mg", 0),
            carbs_g=dish_data.get("carbs_g", 0)
        )

        risk_level = result["risk_level"]
        top_flag = result["flags"][0]["ingredient"] if result.get("flags") else None

        # Check user allergies
        if user_allergies:
            allergy_conflicts = check_allergies(user_allergies, dish_data["ingredients"])
            if allergy_conflicts:
                risk_level = "high"
                top_flag = f"Allergen: {allergy_conflicts[0]['allergen']}"

        dishes_found.append({
            "name": dish_name,
            "risk_level": risk_level,
            "top_flag": top_flag
        })

        if risk_level == "high":
            avoid_dishes.append(dish_name)
            score = 3
        elif risk_level == "moderate":
            score = 2
        else:
            score = 1

        if score < safest_score:
            safest_score = score
            safest_dish = dish_name

    # Sort dishes: Low risk first, then moderate, then high
    risk_order = {"low": 0, "moderate": 1, "high": 2}
    dishes_found.sort(key=lambda d: (risk_order.get(d["risk_level"], 3), d["name"]))

    return {
        "dishes_found": dishes_found,
        "safest_dish": safest_dish,
        "avoid_dishes": avoid_dishes,
        "text_preview": text[:200] if text else None
    }
