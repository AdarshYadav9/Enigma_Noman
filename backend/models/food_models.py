from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict

InputModeType = Literal["text", "voice", "barcode", "image", "menu"]
FoodSourceType = Literal["packaged", "home", "restaurant"]

class FoodAnalyzeRequest(BaseModel):
    food_name: str = Field(..., description="Name of the food or dish to analyze")
    food_source: FoodSourceType = Field("home", description="Source: 'home', 'restaurant', or 'packaged'")
    ingredients: Optional[List[str]] = Field(default=None, description="Optional user-provided list of ingredients")
    nutrition: Optional[Dict[str, Any]] = Field(default=None, description="Optional known nutrition information")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "food_name": "vada pav",
                "food_source": "home",
                "ingredients": ["potato", "gram flour", "oil", "salt"]
            }
        }
    )

class AlternativeRequest(BaseModel):
    food_name: str = Field(..., description="Food name to find personalized healthier alternatives for")
    food_source: Optional[FoodSourceType] = Field("home", description="Food source type")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "food_name": "vada pav",
                "food_source": "home"
            }
        }
    )
