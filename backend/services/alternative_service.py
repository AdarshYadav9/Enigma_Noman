import json
import os
from typing import List, Dict, Any, Optional, Tuple

from services.food_service import normalize_food_name, resolve_food_alias, find_known_food
from risk_engine import analyze_food_personalized
from config import logger

_base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_alternatives_db: Dict[str, List[Dict[str, str]]] = {}

def _load_alternatives():
    global _alternatives_db
    alt_path = os.path.join(_base_dir, "data", "food_alternatives.json")
    if os.path.exists(alt_path):
        with open(alt_path, "r", encoding="utf-8") as f:
            _alternatives_db = json.load(f)

_load_alternatives()

def get_personalized_alternatives(
    food_name: str,
    user_profile: Optional[Dict[str, Any]] = None
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    """
    Finds and personalizes alternative foods for a given dish.
    Validates candidates against the user's profile to prevent recommending
    items containing user allergens or high-risk ingredients.
    Returns (safe_alternatives_list, message).
    """
    canonical_name, _ = resolve_food_alias(food_name)
    search_key = canonical_name or normalize_food_name(food_name)

    candidates = _alternatives_db.get(search_key, [])
    if not candidates:
        return [], "No verified alternative candidates recorded for this food item."

    verified_alternatives = []

    for candidate in candidates:
        cand_name = candidate.get("name")
        if not cand_name:
            continue

        cand_data = find_known_food(cand_name)
        ingredients = cand_data.get("ingredients", []) if cand_data else [cand_name]
        nutrition = {
            "sodium_mg": cand_data.get("sodium_mg", 0),
            "carbs_g": cand_data.get("carbs_g", 0)
        } if cand_data else {}

        # Evaluate candidate against user profile
        assessment = analyze_food_personalized(
            user_profile=user_profile,
            food_name=cand_name,
            food_source="home",
            ingredients=ingredients,
            nutrition=nutrition,
            food_confidence=1.0
        )

        # Only recommend if low risk and zero allergy conflicts
        if assessment["risk_level"] == "low" and not assessment["allergy_conflicts"]:
            verified_alternatives.append({
                "name": cand_name,
                "risk_level": "low",
                "reason": candidate.get("reason", "No identified conflict with the supplied profile.")
            })

    if not verified_alternatives:
        return [], "No sufficiently verified alternative was found that matches your dietary profile."

    return verified_alternatives, None
