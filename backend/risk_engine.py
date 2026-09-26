import json
import os
import re
from typing import List, Dict, Any, Optional, Tuple

from risk_config import (
    SCORE_CRITICAL_ALLERGEN,
    SCORE_HIGH_RISK_INGREDIENT,
    SCORE_MODERATE_RISK_INGREDIENT,
    SCORE_HIGH_SODIUM,
    SCORE_HIGH_SUGAR,
    SCORE_USER_RESTRICTION,
    SCORE_MIN,
    SCORE_MAX,
    THRESHOLD_HIGH_RISK,
    THRESHOLD_MODERATE_RISK,
    STANDARD_DISCLAIMER
)
from config import logger

# Cache datasets
_base_dir = os.path.dirname(os.path.abspath(__file__))
_condition_risks: Dict[str, Any] = {}
_ingredient_aliases: Dict[str, Any] = {}

def _load_risk_data():
    global _condition_risks, _ingredient_aliases
    c_path = os.path.join(_base_dir, 'data', 'condition_risks.json')
    if os.path.exists(c_path):
        with open(c_path, 'r', encoding='utf-8') as f:
            _condition_risks = json.load(f)

    i_path = os.path.join(_base_dir, 'data', 'ingredient_aliases.json')
    if os.path.exists(i_path):
        with open(i_path, 'r', encoding='utf-8') as f:
            _ingredient_aliases = json.load(f)

_load_risk_data()

# Backward compatibility with existing HIDDEN_TERMS
HIDDEN_TERMS = _ingredient_aliases.get("ambiguous_terms", {
  "natural flavours": "often contains MSG or artificial additives",
  "edible starch": "refined carbohydrate — spikes blood sugar",
  "vegetable fat": "usually palm oil or trans fat",
  "fruit juice concentrate": "liquid sugar — same as adding sugar",
  "enriched flour": "maida / refined flour",
  "modified starch": "highly processed carbohydrate",
  "permitted emulsifier": "chemical additive, check for soy",
  "iodised salt": "still sodium — counts toward daily limit",
  "acidity regulator": "may contain sodium compounds"
})

def check_allergies(allergies: List[str], ingredients: List[str]) -> List[Dict[str, Any]]:
    """
    Dedicated allergy checking with synonym/alias expansion.
    Matches user allergies against food ingredients.
    """
    if not allergies or not ingredients:
        return []

    allergen_alias_map = _ingredient_aliases.get("allergen_aliases", {})
    conflicts = []

    # Prepare lower-case ingredient strings
    cleaned_ingredients = [ing.lower().strip() for ing in ingredients if ing]

    for user_allergy in allergies:
        if not user_allergy:
            continue
        allergy_clean = user_allergy.lower().strip()
        
        # Build list of search terms for this allergen
        search_terms = {allergy_clean}
        if allergy_clean in allergen_alias_map:
            search_terms.update([a.lower() for a in allergen_alias_map[allergy_clean]])
        else:
            # Check if user allergy itself is an alias
            for main_allergen, aliases in allergen_alias_map.items():
                if allergy_clean in [a.lower() for a in aliases]:
                    search_terms.update([a.lower() for a in aliases])
                    search_terms.add(main_allergen.lower())

        for ing in cleaned_ingredients:
            # Exact or word-boundary containment match
            matched = False
            for term in search_terms:
                # Direct match or substring
                if term == ing or (len(term) > 3 and term in ing):
                    matched = True
                    break
            
            if matched:
                conflicts.append({
                    "allergen": allergy_clean,
                    "matched_ingredient": ing,
                    "severity": "high"
                })

    return conflicts

def check_ambiguous_terms(ingredients: List[str]) -> List[Dict[str, str]]:
    """Identifies hidden or ambiguous ingredient terms from dataset."""
    ambiguous_map = _ingredient_aliases.get("ambiguous_terms", HIDDEN_TERMS)
    detected = []
    
    for ing in ingredients:
        ing_clean = ing.lower().strip()
        for term, msg in ambiguous_map.items():
            if term in ing_clean:
                detected.append({
                    "term": term,
                    "message": msg
                })
    return detected

def check_dietary_restrictions(
    restrictions: List[str],
    ingredients: List[str]
) -> List[Dict[str, Any]]:
    """
    Checks user-specified dietary preferences (vegetarian, vegan, etc.)
    against known non-compliant ingredients.
    """
    if not restrictions or not ingredients:
        return []

    findings = []
    cleaned_ingredients = [i.lower().strip() for i in ingredients]

    meat_keywords = {"chicken", "mutton", "lamb", "beef", "pork", "fish", "prawn", "crab", "meat", "shrimp"}
    dairy_keywords = {"milk", "butter", "cream", "cheese", "paneer", "ghee", "curd", "yogurt", "whey", "casein"}
    egg_keywords = {"egg", "eggs", "anda", "albumin"}

    for restriction in restrictions:
        rest_clean = restriction.lower().strip()
        if "vegetarian" in rest_clean and "non" not in rest_clean:
            for ing in cleaned_ingredients:
                if any(m in ing for m in meat_keywords):
                    findings.append({
                        "type": "restriction",
                        "condition": "dietary_restriction",
                        "ingredient": ing,
                        "risk_level": "high",
                        "reason": f"Non-vegetarian ingredient '{ing}' conflicts with vegetarian preference."
                    })
        elif "vegan" in rest_clean:
            for ing in cleaned_ingredients:
                if any(m in ing for m in meat_keywords | dairy_keywords | egg_keywords):
                    findings.append({
                        "type": "restriction",
                        "condition": "dietary_restriction",
                        "ingredient": ing,
                        "risk_level": "high",
                        "reason": f"Animal-derived ingredient '{ing}' conflicts with vegan preference."
                    })

    return findings

def analyze_food_personalized(
    user_profile: Optional[Dict[str, Any]],
    food_name: str,
    food_source: str,
    ingredients: List[str],
    nutrition: Optional[Dict[str, Any]] = None,
    food_confidence: float = 1.0,
    uncertainty_factors: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Personalized risk assessment engine.
    Calculates deterministic risk score (0-100), risk level (low, moderate, high, unknown),
    allergy conflicts, condition conflicts, and factual explanations.
    """
    if nutrition is None:
        nutrition = {}
    if uncertainty_factors is None:
        uncertainty_factors = []

    profile = user_profile or {}
    user_conditions = profile.get("conditions", []) + profile.get("diseases", [])
    user_allergies = profile.get("allergies", [])
    user_restrictions = (
        profile.get("dietary_restrictions", []) +
        profile.get("health_restrictions", []) +
        profile.get("doctor_advised_restrictions", [])
    )

    # If no ingredients and no nutrition are available, or food is completely unidentified
    if (not ingredients and not nutrition) or (food_confidence < 0.25 and not ingredients):
        return {
            "risk_level": "unknown",
            "risk_score": None,
            "label": "Unknown Dietary Risk",
            "findings": [],
            "allergy_conflicts": [],
            "nutrition_flags": [],
            "safe_items": [],
            "ambiguous_terms": [],
            "explanation": "Unable to confidently assess risk because food identity or ingredient information is incomplete.",
            "uncertainty": ["Food not reliably recognized or ingredient list unavailable."] + uncertainty_factors,
            "confidence": {
                "food_identification": food_confidence,
                "ingredient_information": 0.0,
                "overall": round(food_confidence * 0.5, 2)
            }
        }

    risk_score = 0
    findings = []
    nutrition_flags = []
    safe_ingredients = set(ingredients)

    # 1. ALLERGY CHECKS (Critical weight +60)
    allergy_conflicts = check_allergies(user_allergies, ingredients)
    if allergy_conflicts:
        risk_score += SCORE_CRITICAL_ALLERGEN
        for conf in allergy_conflicts:
            safe_ingredients.discard(conf["matched_ingredient"])

    # 2. CONDITION CHECKS (High +30, Mod +15)
    for cond in user_conditions:
        cond_clean = cond.lower().strip()
        c_data = _condition_risks.get(cond_clean)
        if not c_data:
            continue

        c_label = c_data.get("label", cond)
        high_risk_list = c_data.get("high_risk_ingredients", c_data.get("high", []))
        mod_risk_list = c_data.get("moderate_risk_ingredients", c_data.get("moderate", []))

        for ing in ingredients:
            ing_lower = ing.lower().strip()
            
            # Check high-risk ingredient
            if any(h in ing_lower for h in high_risk_list):
                risk_score += SCORE_HIGH_RISK_INGREDIENT
                findings.append({
                    "type": "condition",
                    "condition": cond_clean,
                    "ingredient": ing,
                    "risk_level": "high",
                    "reason": f"High risk ingredient '{ing}' for {c_label}"
                })
                safe_ingredients.discard(ing)

            # Check moderate-risk ingredient
            elif any(m in ing_lower for m in mod_risk_list):
                risk_score += SCORE_MODERATE_RISK_INGREDIENT
                findings.append({
                    "type": "condition",
                    "condition": cond_clean,
                    "ingredient": ing,
                    "risk_level": "moderate",
                    "reason": f"Moderate risk ingredient '{ing}' for {c_label}"
                })
                safe_ingredients.discard(ing)

        # 3. NUTRITION CHECKS FOR CONDITIONS
        limits = c_data.get("limits", {})
        sodium_limit = limits.get("sodium_mg", c_data.get("sodium_safe_mg"))
        carbs_limit = limits.get("carbs_g", c_data.get("carb_limit_g"))
        sugar_limit = limits.get("sugar_g")

        # Sodium check
        sodium_val = nutrition.get("sodium_mg") or nutrition.get("sodium")
        if sodium_val and sodium_limit and sodium_val > sodium_limit:
            risk_score += SCORE_HIGH_SODIUM
            nutrition_flags.append({
                "nutrient": "sodium",
                "value": sodium_val,
                "unit": "mg",
                "limit": sodium_limit,
                "status": "high_for_profile",
                "reason": f"Sodium ({sodium_val}mg) exceeds recommended limit ({sodium_limit}mg) for {c_label}."
            })

        # Sugar check
        sugar_val = nutrition.get("sugar_g") or nutrition.get("sugar")
        if sugar_val and sugar_limit and sugar_val > sugar_limit:
            risk_score += SCORE_HIGH_SUGAR
            nutrition_flags.append({
                "nutrient": "sugar",
                "value": sugar_val,
                "unit": "g",
                "limit": sugar_limit,
                "status": "high_for_profile",
                "reason": f"Sugar ({sugar_val}g) exceeds target limit ({sugar_limit}g) for {c_label}."
            })

        # Carbs check
        carbs_val = nutrition.get("carbs_g") or nutrition.get("carbohydrates")
        if carbs_val and carbs_limit and carbs_val > carbs_limit:
            risk_score += SCORE_MODERATE_RISK_INGREDIENT
            nutrition_flags.append({
                "nutrient": "carbohydrates",
                "value": carbs_val,
                "unit": "g",
                "limit": carbs_limit,
                "status": "moderate_for_profile",
                "reason": f"Carbohydrate content ({carbs_val}g) is high for {c_label}."
            })

    # 4. DIETARY & DOCTOR RESTRICTIONS (+20)
    restriction_findings = check_dietary_restrictions(user_restrictions, ingredients)
    if restriction_findings:
        risk_score += SCORE_USER_RESTRICTION
        findings.extend(restriction_findings)

    # 5. AMBIGUOUS / HIDDEN TERMS
    ambiguous_terms = check_ambiguous_terms(ingredients)

    # Clamping risk score 0 - 100
    final_score = max(SCORE_MIN, min(SCORE_MAX, risk_score))

    has_high_findings = any(f.get("risk_level") == "high" for f in findings)
    has_high_nutrition = any(nf.get("status") == "high_for_profile" for nf in nutrition_flags)
    has_mod_findings = any(f.get("risk_level") == "moderate" for f in findings)
    has_mod_nutrition = any(nf.get("status") == "moderate_for_profile" for nf in nutrition_flags)

    # Evaluate risk level
    if allergy_conflicts or has_high_findings or has_high_nutrition or final_score >= THRESHOLD_HIGH_RISK:
        risk_level = "high"
        if allergy_conflicts:
            explanation = "High dietary risk: Ingredient conflicts directly with your recorded allergy."
        elif has_high_nutrition:
            explanation = "High dietary risk: Food contains nutritional values that exceed safe thresholds for your active conditions."
        else:
            explanation = "High dietary risk: Ingredient or nutritional properties conflict with your active health profile."
    elif has_mod_findings or has_mod_nutrition or final_score >= THRESHOLD_MODERATE_RISK:
        risk_level = "moderate"
        explanation = "Moderate dietary risk: Contains ingredients or nutritional factors to consume in moderation."
    else:
        risk_level = "low"
        explanation = "Low dietary risk: No identified conflicts detected against your active health profile."

    # Uncertainty factor evaluation
    uncertainty = list(uncertainty_factors)
    if food_source == "restaurant":
        uncertainty.append("Restaurant preparation method and exact oil/sodium levels may vary.")
    if ambiguous_terms:
        uncertainty.append("Contains ambiguous ingredient labels whose exact composition is unspecified.")

    # Calculate overall confidence
    ing_confidence = 1.0 if ingredients else (0.5 if nutrition else 0.2)
    overall_confidence = round((food_confidence * 0.6) + (ing_confidence * 0.4), 2)

    return {
        "risk_level": risk_level,
        "risk_score": final_score,
        "label": "Rule-based dietary risk indicator",
        "findings": findings,
        "allergy_conflicts": allergy_conflicts,
        "nutrition_flags": nutrition_flags,
        "safe_items": list(safe_ingredients),
        "ambiguous_terms": ambiguous_terms,
        "explanation": explanation,
        "uncertainty": uncertainty,
        "confidence": {
            "food_identification": food_confidence,
            "ingredient_information": ing_confidence,
            "overall": overall_confidence
        }
    }

# ---------------------------------------------------------------------------
# Backward-compatible function for existing endpoints
# ---------------------------------------------------------------------------
def analyze_risk(
    ingredients: list,
    conditions: list,
    sodium_mg: int = 0,
    carbs_g: int = 0
) -> dict:
    """
    Original risk analysis function preserved for backward compatibility.
    """
    c_path = os.path.join(_base_dir, 'data', 'condition_risks.json')
    with open(c_path, 'r', encoding='utf-8') as f:
        condition_risks = json.load(f)

    flags = []
    sodium_exceeded_by = []
    safe_ingredients = set(ingredients)

    for condition in conditions:
        if condition not in condition_risks:
            continue
        
        c_data = condition_risks[condition]
        high_list = c_data.get("high_risk_ingredients", c_data.get("high", []))
        mod_list = c_data.get("moderate_risk_ingredients", c_data.get("moderate", []))
        
        for ing in ingredients:
            ing_lower = ing.lower().strip()
            
            if ing_lower in high_list or any(h == ing_lower for h in high_list):
                flags.append({
                    "ingredient": ing,
                    "risk_level": "high",
                    "condition": condition,
                    "reason": f"High risk ingredient for {c_data.get('label', condition)}"
                })
                safe_ingredients.discard(ing)
            elif ing_lower in mod_list or any(m == ing_lower for m in mod_list):
                flags.append({
                    "ingredient": ing,
                    "risk_level": "moderate",
                    "condition": condition,
                    "reason": f"Moderate risk ingredient for {c_data.get('label', condition)}"
                })
                safe_ingredients.discard(ing)
        
        # Check sodium
        sodium_safe = c_data.get("limits", {}).get("sodium_mg", c_data.get("sodium_safe_mg"))
        if sodium_mg > 0 and sodium_safe:
            if sodium_mg > sodium_safe:
                sodium_exceeded_by.append(c_data.get("label", condition))

    has_high = any(f["risk_level"] == "high" for f in flags)
    has_mod = any(f["risk_level"] == "moderate" for f in flags)
    
    if has_high:
        risk_level = "high"
        explanation = "We found high-risk ingredients for your conditions. Please avoid."
    elif has_mod:
        risk_level = "moderate"
        explanation = "We found some moderate-risk ingredients. Consume in moderation."
    else:
        risk_level = "low"
        explanation = "This food looks safe for your selected conditions."

    sodium_warning = None
    if sodium_exceeded_by:
        sodium_warning = f"Sodium limit exceeded for: {', '.join(sodium_exceeded_by)}"
        risk_level = "high"

    hidden_alerts = []
    for ing in ingredients:
        ing_lower = ing.lower().strip()
        for term, meaning in HIDDEN_TERMS.items():
            if term in ing_lower:
                hidden_alerts.append({
                    "term": term,
                    "meaning": meaning
                })

    return {
        "risk_level": risk_level,
        "flags": flags,
        "explanation": explanation,
        "hidden_alerts": hidden_alerts,
        "sodium_warning": sodium_warning,
        "safe_ingredients": list(safe_ingredients),
        "ingredients_found": ingredients
    }
