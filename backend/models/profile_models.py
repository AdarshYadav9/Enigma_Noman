from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class ProfileBase(BaseModel):
    age: Optional[int] = Field(None, ge=0, le=120, description="Age in years (0 to 120)")
    height_cm: Optional[float] = Field(None, ge=50, le=250, description="Height in cm (50 to 250)")
    allergies: List[str] = Field(default_factory=list, description="List of confirmed food allergens, e.g. peanut, shellfish")
    conditions: List[str] = Field(default_factory=list, description="Medical conditions, e.g. diabetes, hypertension")
    diseases: List[str] = Field(default_factory=list, description="Diagnosed diseases")
    health_issues: List[str] = Field(default_factory=list, description="Health symptoms or issues, e.g. high blood sugar")
    dietary_restrictions: List[str] = Field(default_factory=list, description="Dietary preferences, e.g. vegetarian, vegan")
    health_restrictions: List[str] = Field(default_factory=list, description="Health constraints, e.g. low sodium")
    doctor_advised_restrictions: List[str] = Field(default_factory=list, description="Doctor advised food restrictions")

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: Optional[str] = None
    firebase_uid: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "firebase_uid": "user_abc123",
                "age": 21,
                "height_cm": 172.0,
                "allergies": ["peanut", "shellfish"],
                "conditions": ["diabetes", "hypertension"],
                "diseases": [],
                "health_issues": ["high blood sugar"],
                "dietary_restrictions": ["vegetarian"],
                "health_restrictions": ["low sodium"],
                "doctor_advised_restrictions": ["avoid high sugar foods"],
                "created_at": "2026-09-26T10:00:00Z",
                "updated_at": "2026-09-26T10:00:00Z"
            }
        }
    )
