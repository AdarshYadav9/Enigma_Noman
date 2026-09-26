import json
import os

HIDDEN_TERMS = {
  "natural flavours": "often contains MSG or artificial additives",
  "edible starch": "refined carbohydrate — spikes blood sugar",
  "vegetable fat": "usually palm oil or trans fat",
  "fruit juice concentrate": "liquid sugar — same as adding sugar",
  "enriched flour": "maida / refined flour",
  "modified starch": "highly processed carbohydrate",
  "permitted emulsifier": "chemical additive, check for soy",
  "iodised salt": "still sodium — counts toward daily limit",
  "acidity regulator": "may contain sodium compounds"
}

def analyze_risk(ingredients: list, conditions: list, 
                 sodium_mg: int = 0, carbs_g: int = 0) -> dict:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, 'data', 'condition_risks.json')
    
    with open(file_path, 'r') as f:
        condition_risks = json.load(f)

    flags = []
    sodium_exceeded_by = []
    safe_ingredients = set(ingredients)

    for condition in conditions:
        if condition not in condition_risks:
            continue
        
        c_data = condition_risks[condition]
        
        for ing in ingredients:
            ing_lower = ing.lower().strip()
            
            if ing_lower in c_data.get("high", []):
                flags.append({
                    "ingredient": ing,
                    "risk_level": "high",
                    "condition": condition,
                    "reason": f"High risk ingredient for {c_data.get('label', condition)}"
                })
                safe_ingredients.discard(ing)
            elif ing_lower in c_data.get("moderate", []):
                flags.append({
                    "ingredient": ing,
                    "risk_level": "moderate",
                    "condition": condition,
                    "reason": f"Moderate risk ingredient for {c_data.get('label', condition)}"
                })
                safe_ingredients.discard(ing)
        
        # Check sodium
        if sodium_mg > 0 and "sodium_safe_mg" in c_data:
            if sodium_mg > c_data["sodium_safe_mg"]:
                sodium_exceeded_by.append(c_data["label"])

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
        risk_level = "high" # Exceeding sodium is a high risk

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
        "safe_ingredients": list(safe_ingredients)
    }
