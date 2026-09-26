import json
import os
import re
from typing import Optional, Dict, Any, Tuple
from rapidfuzz import fuzz

from risk_config import (
    CONFIDENCE_CONFIRMED,
    CONFIDENCE_LIKELY,
    CONFIDENCE_UNCERTAIN
)
from config import logger

# Cache datasets once
_dishes_db: Dict[str, Any] = {}
_food_aliases: Dict[str, list] = {}

def _load_data_files():
    global _dishes_db, _food_aliases
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    dishes_path = os.path.join(base_dir, "data", "indian_dishes.json")
    if os.path.exists(dishes_path):
        with open(dishes_path, "r", encoding="utf-8") as f:
            _dishes_db = json.load(f)

    aliases_path = os.path.join(base_dir, "data", "food_aliases.json")
    if os.path.exists(aliases_path):
        with open(aliases_path, "r", encoding="utf-8") as f:
            _food_aliases = json.load(f)

_load_data_files()

def get_dishes_db() -> Dict[str, Any]:
    return _dishes_db

import unicodedata

def normalize_food_name(raw_name: str) -> str:
    """
    Cleans and standardizes raw food names:
    - lowercase
    - trims whitespace
    - replaces hyphens/underscores/slashes with space
    - preserves multilingual letters/marks (including Devanagari matras) while removing punctuation
    - collapses redundant spaces
    """
    if not raw_name:
        return ""
    text = raw_name.replace('-', ' ').replace('_', ' ').replace('/', ' ')
    # Remove punctuation while preserving all Unicode letters and marks
    cleaned = ''.join(c for c in text if not unicodedata.category(c).startswith('P')).lower()
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def resolve_food_alias(name: str) -> Tuple[Optional[str], float]:
    """
    Matches normalized food name against known food aliases and dishes database.
    Returns (canonical_name, confidence).
    """
    cleaned = normalize_food_name(name)
    if not cleaned:
        return None, 0.0

    # 1. Direct match with dishes DB keys
    if cleaned in _dishes_db:
        return cleaned, 1.0

    # 2. Direct match with alias dictionary
    for canonical, aliases in _food_aliases.items():
        if cleaned == canonical.lower():
            return canonical, 1.0
        for alias in aliases:
            if cleaned == alias.lower():
                return canonical, 0.98

    # 3. Conservative fuzzy matching against canonical names and aliases
    best_match = None
    best_score = 0.0

    for canonical, aliases in _food_aliases.items():
        score = fuzz.token_sort_ratio(cleaned, canonical)
        if score > best_score:
            best_score = score
            best_match = canonical
        for alias in aliases:
            a_score = fuzz.token_sort_ratio(cleaned, alias)
            if a_score > best_score:
                best_score = a_score
                best_match = canonical

    # Also check against dishes DB keys directly
    for dish_key in _dishes_db.keys():
        score = fuzz.token_sort_ratio(cleaned, dish_key)
        if score > best_score:
            best_score = score
            best_match = dish_key

    # Score threshold evaluation
    confidence = round(best_score / 100.0, 2)
    if confidence >= 0.85:
        return best_match, confidence
    elif confidence >= 0.65:
        # Partial / likely match
        return best_match, confidence

    # Not confident enough
    return None, confidence

def find_known_food(normalized_name: str) -> Optional[Dict[str, Any]]:
    """Retrieve ingredients and nutrition for a known dish if available."""
    if normalized_name in _dishes_db:
        return _dishes_db[normalized_name]
    return None

def calculate_food_confidence(confidence_score: float) -> Tuple[str, float]:
    """
    Categorize confidence into one of the 4 defined system states:
    confirmed (0.90 - 1.00)
    likely (0.70 - 0.89)
    uncertain (0.40 - 0.69)
    unknown (0.00 - 0.39)
    """
    score = round(max(0.0, min(1.0, confidence_score)), 2)
    if score >= CONFIDENCE_CONFIRMED:
        return "confirmed", score
    elif score >= CONFIDENCE_LIKELY:
        return "likely", score
    elif score >= CONFIDENCE_UNCERTAIN:
        return "uncertain", score
    else:
        return "unknown", score
