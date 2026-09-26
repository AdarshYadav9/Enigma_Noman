from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class FoodInfo(BaseModel):
    name: Optional[str] = None
    normalized_name: Optional[str] = None
    source: str = "home"
    input_mode: str = "text"
    confidence: float = 0.0

class RiskInfo(BaseModel):
    level: str = "unknown"  # low, moderate, high, unknown
    score: Optional[int] = None  # 0 to 100, or None if unknown
    label: str = "Rule-based dietary risk indicator"

class UserContext(BaseModel):
    conditions_considered: List[str] = Field(default_factory=list)
    allergies_considered: List[str] = Field(default_factory=list)
    restrictions_considered: List[str] = Field(default_factory=list)

class FindingItem(BaseModel):
    type: str  # condition, restriction, nutrition
    condition: Optional[str] = None
    ingredient: Optional[str] = None
    risk_level: Optional[str] = None
    reason: str

class AllergyConflictItem(BaseModel):
    allergen: str
    matched_ingredient: str
    severity: str = "high"

class AmbiguousTermItem(BaseModel):
    term: str
    message: str

class AlternativeItem(BaseModel):
    name: str
    risk_level: str
    reason: str

class ConfidenceInfo(BaseModel):
    food_identification: float = 0.0
    ingredient_information: float = 0.0
    overall: float = 0.0

class StandardFoodResponse(BaseModel):
    status: str = "success"  # success, uncertain, unknown, profile_required, not_found, etc.
    message: Optional[str] = None
    reason: Optional[str] = None
    food: Optional[FoodInfo] = None
    risk: Optional[RiskInfo] = None
    user_context: Optional[UserContext] = None
    findings: List[FindingItem] = Field(default_factory=list)
    allergy_conflicts: List[AllergyConflictItem] = Field(default_factory=list)
    nutrition: Dict[str, Any] = Field(default_factory=dict)
    nutrition_flags: List[Dict[str, Any]] = Field(default_factory=list)
    safe_items: List[str] = Field(default_factory=list)
    ambiguous_terms: List[AmbiguousTermItem] = Field(default_factory=list)
    alternatives: List[AlternativeItem] = Field(default_factory=list)
    alternative_message: Optional[str] = None
    confidence: Optional[ConfidenceInfo] = None
    uncertainty: List[str] = Field(default_factory=list)
    disclaimer: str = (
        "This is an informational dietary risk assessment based on rule-matching against your health profile, "
        "not a clinical medical diagnosis or treatment plan."
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "success",
                "food": {
                    "name": "vada pav",
                    "normalized_name": "vada pav",
                    "source": "home",
                    "input_mode": "voice",
                    "confidence": 0.94
                },
                "risk": {
                    "level": "moderate",
                    "score": 58,
                    "label": "Rule-based dietary risk indicator"
                },
                "user_context": {
                    "conditions_considered": ["diabetes"],
                    "allergies_considered": ["peanut"],
                    "restrictions_considered": ["low sodium"]
                },
                "findings": [
                    {
                        "type": "condition",
                        "condition": "diabetes",
                        "ingredient": "maida",
                        "risk_level": "high",
                        "reason": "High risk ingredient for Blood Sugar Risk"
                    }
                ],
                "allergy_conflicts": [],
                "nutrition": {"sodium_mg": 520, "carbs_g": 55},
                "ambiguous_terms": [],
                "alternatives": [
                    {
                        "name": "idli sambar",
                        "risk_level": "low",
                        "reason": "No identified conflict with the supplied profile."
                    }
                ],
                "confidence": {
                    "food_identification": 0.94,
                    "ingredient_information": 0.72,
                    "overall": 0.82
                },
                "uncertainty": [],
                "disclaimer": "This is an informational dietary risk assessment and not a medical diagnosis."
            }
        }
    )
