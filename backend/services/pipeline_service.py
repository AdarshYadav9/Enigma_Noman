from typing import Optional, Dict, Any, List

from services.food_service import (
    normalize_food_name,
    resolve_food_alias,
    find_known_food,
    calculate_food_confidence
)
from risk_engine import analyze_food_personalized
from services.alternative_service import get_personalized_alternatives
from db.repositories import get_profile_by_firebase_uid, save_food_history
from risk_config import (
    CONFIDENCE_CONFIRMED,
    CONFIDENCE_LIKELY,
    CONFIDENCE_UNCERTAIN,
    STANDARD_DISCLAIMER,
    UNCERTAINTY_MESSAGE_UNKNOWN,
    UNCERTAINTY_MESSAGE_PARTIAL
)
from config import logger

def analyze_food_for_user(
    firebase_uid: Optional[str],
    food_name: Optional[str],
    food_source: str = "home",
    input_mode: str = "text",
    ingredients: Optional[List[str]] = None,
    nutrition: Optional[Dict[str, Any]] = None,
    raw_confidence: float = 1.0,
    source_image_path: Optional[str] = None,
    skip_history: bool = False,
    fallback_profile: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Central unified food risk assessment pipeline.
    Connects:
    Normalization -> Dish Lookup -> Profile Retrieval -> Risk Analysis -> Alternatives -> History Persistence
    """
    if nutrition is None:
        nutrition = {}

    # 1. Retrieve User Profile if authenticated
    user_profile = None
    if firebase_uid:
        user_profile = get_profile_by_firebase_uid(firebase_uid)
        if not user_profile:
            return {
                "status": "profile_required",
                "message": "Please complete your health profile before using personalized food risk analysis.",
                "disclaimer": STANDARD_DISCLAIMER
            }
    elif fallback_profile:
        user_profile = fallback_profile

    # 2. Food Identification & Normalization
    raw_input_name = food_name or ""
    normalized_name = normalize_food_name(raw_input_name)
    canonical_dish = None
    food_confidence = raw_confidence

    if normalized_name:
        resolved_dish, alias_conf = resolve_food_alias(normalized_name)
        if resolved_dish:
            canonical_dish = resolved_dish
            food_confidence = min(raw_confidence, alias_conf)
        else:
            canonical_dish = normalized_name
            if ingredients or food_source == "packaged":
                food_confidence = max(raw_confidence, 0.85)
            else:
                food_confidence = min(raw_confidence, 0.45)
    else:
        if ingredients:
            food_confidence = 0.85
            canonical_dish = "Packaged Food"
        else:
            food_confidence = 0.0

    confidence_state, rounded_conf = calculate_food_confidence(food_confidence)

    # 3. Handle Unknown Food Identification
    if confidence_state == "unknown" and not ingredients and not nutrition:
        result = {
            "status": "unknown",
            "message": UNCERTAINTY_MESSAGE_UNKNOWN,
            "reason": "No reliable food match or ingredient information was found.",
            "food": {
                "name": raw_input_name or None,
                "normalized_name": None,
                "source": food_source,
                "input_mode": input_mode,
                "confidence": rounded_conf
            },
            "risk": {
                "level": "unknown",
                "score": None,
                "label": "Unknown Dietary Risk"
            },
            "user_context": {
                "conditions_considered": user_profile.get("conditions", []) if user_profile else [],
                "allergies_considered": user_profile.get("allergies", []) if user_profile else [],
                "restrictions_considered": (
                    user_profile.get("dietary_restrictions", []) +
                    user_profile.get("health_restrictions", [])
                ) if user_profile else []
            },
            "findings": [],
            "allergy_conflicts": [],
            "nutrition": {},
            "nutrition_flags": [],
            "safe_items": [],
            "ambiguous_terms": [],
            "alternatives": [],
            "confidence": {
                "food_identification": rounded_conf,
                "ingredient_information": 0.0,
                "overall": rounded_conf
            },
            "uncertainty": ["The food item could not be verified in the food knowledge base."],
            "disclaimer": STANDARD_DISCLAIMER
        }

        if firebase_uid and not skip_history:
            save_food_history(
                firebase_uid=firebase_uid,
                input_mode=input_mode,
                food_source=food_source,
                food_name=raw_input_name,
                normalized_food_name=None,
                confidence=rounded_conf,
                risk_level="unknown",
                risk_score=None,
                result_json=result,
                source_image_path=source_image_path
            )
        return result

    # 4. Ingredient & Nutrition Resolution
    final_ingredients = list(ingredients) if ingredients else []
    final_nutrition = dict(nutrition)
    uncertainty_factors = []

    if canonical_dish:
        known_dish_info = find_known_food(canonical_dish)
        if known_dish_info:
            # If ingredients not supplied by user, use known dish ingredients
            if not final_ingredients:
                final_ingredients = list(known_dish_info.get("ingredients", []))
            
            # If nutrition not provided, populate known dish values
            if not final_nutrition:
                if "sodium_mg" in known_dish_info:
                    final_nutrition["sodium_mg"] = known_dish_info["sodium_mg"]
                if "carbs_g" in known_dish_info:
                    final_nutrition["carbs_g"] = known_dish_info["carbs_g"]

    # Handling food source specific uncertainties
    if food_source == "restaurant":
        uncertainty_factors.append("Exact restaurant oil/sodium quantity and preparation methods are unavailable.")
    elif food_source == "home" and not ingredients and not canonical_dish:
        uncertainty_factors.append("Home preparation ingredients not explicitly provided.")

    # 5. Handle Uncertain / Partial Information
    if not final_ingredients and not final_nutrition:
        user_conds = user_profile.get("conditions", []) if user_profile else []
        user_allerg = user_profile.get("allergies", []) if user_profile else []
        has_critical = len(user_conds) > 0 or len(user_allerg) > 0
        baseline_score = 30 if has_critical else 10
        baseline_level = "moderate" if has_critical else "low"

        result = {
            "status": "uncertain",
            "message": UNCERTAINTY_MESSAGE_PARTIAL,
            "reason": f"Identified '{canonical_dish or raw_input_name}', but detailed recipe ingredients were not specified.",
            "food": {
                "name": raw_input_name,
                "normalized_name": canonical_dish,
                "source": food_source,
                "input_mode": input_mode,
                "confidence": rounded_conf
            },
            "risk": {
                "level": baseline_level,
                "score": baseline_score,
                "label": "Rule-based conflict score (general preparation)"
            },
            "risk_score": baseline_score,
            "risk_level": baseline_level,
            "risk_label": "Rule-based conflict score (general preparation)",
            "user_context": {
                "conditions_considered": user_profile.get("conditions", []) if user_profile else [],
                "allergies_considered": user_profile.get("allergies", []) if user_profile else [],
                "restrictions_considered": (
                    user_profile.get("dietary_restrictions", []) +
                    user_profile.get("health_restrictions", [])
                ) if user_profile else []
            },
            "findings": [],
            "allergy_conflicts": [],
            "nutrition": {},
            "nutrition_flags": [],
            "safe_items": [],
            "ambiguous_terms": [],
            "alternatives": [],
            "confidence": {
                "food_identification": rounded_conf,
                "ingredient_information": 0.0,
                "overall": round(rounded_conf * 0.5, 2)
            },
            "uncertainty": uncertainty_factors + ["Exact recipe ingredient list was not specified."],
            "disclaimer": STANDARD_DISCLAIMER
        }

        if firebase_uid and not skip_history:
            save_food_history(
                firebase_uid=firebase_uid,
                input_mode=input_mode,
                food_source=food_source,
                food_name=raw_input_name,
                normalized_food_name=canonical_dish,
                confidence=rounded_conf,
                risk_level=baseline_level,
                risk_score=baseline_score,
                result_json=result,
                source_image_path=source_image_path
            )
        return result

    # 6. Execute Personalized Risk Engine
    risk_assessment = analyze_food_personalized(
        user_profile=user_profile,
        food_name=canonical_dish or raw_input_name,
        food_source=food_source,
        ingredients=final_ingredients,
        nutrition=final_nutrition,
        food_confidence=rounded_conf,
        uncertainty_factors=uncertainty_factors
    )

    # 7. Generate Personalized Alternatives if High or Moderate Risk
    alternatives = []
    alt_message = None
    if risk_assessment["risk_level"] in ["high", "moderate"]:
        target_lookup = canonical_dish or raw_input_name
        alternatives, alt_message = get_personalized_alternatives(
            food_name=target_lookup,
            user_profile=user_profile
        )

    # 8. Build Structured Output Response
    final_response = {
        "status": "success",
        "food": {
            "name": raw_input_name,
            "normalized_name": canonical_dish,
            "source": food_source,
            "input_mode": input_mode,
            "confidence": rounded_conf
        },
        "risk": {
            "level": risk_assessment["risk_level"],
            "score": risk_assessment["risk_score"],
            "label": risk_assessment["label"]
        },
        "risk_score": risk_assessment["risk_score"],
        "risk_level": risk_assessment["risk_level"],
        "risk_label": risk_assessment["label"],
        "user_context": {
            "conditions_considered": user_profile.get("conditions", []) if user_profile else [],
            "allergies_considered": user_profile.get("allergies", []) if user_profile else [],
            "restrictions_considered": (
                user_profile.get("dietary_restrictions", []) +
                user_profile.get("health_restrictions", [])
            ) if user_profile else []
        },
        "findings": risk_assessment["findings"],
        "allergy_conflicts": risk_assessment["allergy_conflicts"],
        "nutrition": final_nutrition,
        "nutrition_flags": risk_assessment["nutrition_flags"],
        "safe_items": risk_assessment["safe_items"],
        "ambiguous_terms": risk_assessment["ambiguous_terms"],
        "alternatives": alternatives,
        "alternative_message": alt_message,
        "confidence": risk_assessment["confidence"],
        "uncertainty": risk_assessment["uncertainty"],
        "disclaimer": STANDARD_DISCLAIMER
    }

    # 9. Persist History in Supabase
    if firebase_uid and not skip_history:
        save_food_history(
            firebase_uid=firebase_uid,
            input_mode=input_mode,
            food_source=food_source,
            food_name=raw_input_name,
            normalized_food_name=canonical_dish,
            confidence=rounded_conf,
            risk_level=risk_assessment["risk_level"],
            risk_score=risk_assessment["risk_score"],
            result_json=final_response,
            source_image_path=source_image_path
        )

    return final_response
