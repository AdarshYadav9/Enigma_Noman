import io
import pytest
from fastapi.testclient import TestClient

from main import app
from services.food_service import (
    normalize_food_name,
    resolve_food_alias,
    calculate_food_confidence
)
from services.sarvam_service import extract_food_phrase
from risk_engine import (
    analyze_risk,
    analyze_food_personalized,
    check_allergies
)
from services.alternative_service import get_personalized_alternatives

client = TestClient(app)

TEST_AUTH_HEADER = {"Authorization": "Bearer test_token_user_tester_99"}

# -----------------------------------------------------------------------------
# 1. Health & Search
# -----------------------------------------------------------------------------
def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_dish_search():
    response = client.get("/dish/search?q=poha")
    assert response.status_code == 200
    results = response.json()
    assert len(results) > 0
    assert results[0]["name"] == "poha"

# -----------------------------------------------------------------------------
# 2. Authentication & Isolation
# -----------------------------------------------------------------------------
def test_missing_auth_token():
    response = client.get("/profile")
    assert response.status_code == 401

def test_invalid_auth_token():
    response = client.get("/profile", headers={"Authorization": "Bearer invalid_garbage_token"})
    assert response.status_code == 401

# -----------------------------------------------------------------------------
# 3. User Health Profile CRUD & Validation
# -----------------------------------------------------------------------------
def test_profile_create_get_update_delete():
    # 1. Create
    profile_payload = {
        "age": 25,
        "height_cm": 175.5,
        "allergies": ["peanut"],
        "conditions": ["diabetes"],
        "dietary_restrictions": ["vegetarian"],
        "health_restrictions": ["low sodium"]
    }
    create_res = client.post("/profile", json=profile_payload, headers=TEST_AUTH_HEADER)
    assert create_res.status_code == 200
    data = create_res.json()
    assert data["age"] == 25
    assert data["firebase_uid"] == "user_tester_99"
    assert "peanut" in data["allergies"]

    # 2. Get
    get_res = client.get("/profile", headers=TEST_AUTH_HEADER)
    assert get_res.status_code == 200
    assert get_res.json()["firebase_uid"] == "user_tester_99"

    # 3. Update
    update_payload = {"age": 26, "allergies": ["peanut", "shellfish"]}
    put_res = client.put("/profile", json=update_payload, headers=TEST_AUTH_HEADER)
    assert put_res.status_code == 200
    assert put_res.json()["age"] == 26
    assert "shellfish" in put_res.json()["allergies"]

    # 4. Delete
    del_res = client.delete("/profile", headers=TEST_AUTH_HEADER)
    assert del_res.status_code == 200
    assert del_res.json()["deleted"] is True

def test_profile_validation_errors():
    # Invalid age > 120
    res = client.post("/profile", json={"age": 150}, headers=TEST_AUTH_HEADER)
    assert res.status_code == 422

    # Invalid height < 50
    res2 = client.post("/profile", json={"height_cm": 30}, headers=TEST_AUTH_HEADER)
    assert res2.status_code == 422

# -----------------------------------------------------------------------------
# 4. Food Normalization & Aliases
# -----------------------------------------------------------------------------
def test_food_normalization():
    assert normalize_food_name("Vada-Pav  ") == "vada pav"
    assert normalize_food_name("Poha!") == "poha"
    assert normalize_food_name("Butter__Chicken") == "butter chicken"

def test_food_alias_resolution():
    # Exact alias
    dish, conf = resolve_food_alias("vadapav")
    assert dish == "vada pav"
    assert conf >= 0.90

    # Devanagari transliteration
    dish, conf = resolve_food_alias("पाव भाजी")
    assert dish == "pav bhaji"
    assert conf >= 0.90

    # Fuzzy match
    dish, conf = resolve_food_alias("pohay")
    assert dish == "poha"
    assert conf >= 0.85

def test_unknown_food_confidence():
    state, score = calculate_food_confidence(0.15)
    assert state == "unknown"
    state, score = calculate_food_confidence(0.55)
    assert state == "uncertain"
    state, score = calculate_food_confidence(0.95)
    assert state == "confirmed"

# -----------------------------------------------------------------------------
# 5. Risk Engine & Personalization
# -----------------------------------------------------------------------------
def test_allergy_engine_exact_and_alias():
    # groundnut alias for peanut
    conflicts = check_allergies(allergies=["peanut"], ingredients=["groundnut oil", "onion", "salt"])
    assert len(conflicts) > 0
    assert conflicts[0]["allergen"] == "peanut"

def test_personalized_risk_high_allergy():
    profile = {
        "allergies": ["peanut"],
        "conditions": []
    }
    # Poha contains peanut in indian_dishes.json
    res = analyze_food_personalized(
        user_profile=profile,
        food_name="poha",
        food_source="home",
        ingredients=["flattened rice", "peanut", "oil", "salt"],
        nutrition={"sodium_mg": 340, "carbs_g": 52}
    )
    assert res["risk_level"] == "high"
    assert len(res["allergy_conflicts"]) > 0
    assert res["risk_score"] >= 60

def test_personalized_risk_condition_limits():
    profile = {
        "allergies": [],
        "conditions": ["hypertension"]
    }
    # High sodium (exceeds 1500mg)
    res = analyze_food_personalized(
        user_profile=profile,
        food_name="high_salt_meal",
        food_source="home",
        ingredients=["rice", "salt"],
        nutrition={"sodium_mg": 2200}
    )
    assert res["risk_level"] == "high"
    assert len(res["nutrition_flags"]) > 0
    assert res["nutrition_flags"][0]["nutrient"] == "sodium"

# -----------------------------------------------------------------------------
# 6. Uncertainty & No Hallucination
# -----------------------------------------------------------------------------
def test_unknown_food_assessment():
    res = client.post(
        "/food/analyze",
        json={"food_name": "completely_unknown_extraterrestrial_dish", "food_source": "home"},
        headers=TEST_AUTH_HEADER
    )
    # Profile required or unknown response
    data = res.json()
    assert data["status"] in ["unknown", "profile_required"]
    if data["status"] == "unknown":
        assert data["risk"]["level"] == "unknown"
        assert "not sure" in data["message"].lower()

# -----------------------------------------------------------------------------
# 7. Alternatives System
# -----------------------------------------------------------------------------
def test_alternatives_filtering():
    # User with allergy to peanut
    profile = {
        "allergies": ["peanut"],
        "conditions": ["diabetes"]
    }
    alts, msg = get_personalized_alternatives("vada pav", user_profile=profile)
    # Poha contains peanut, so poha must NOT be suggested to this user!
    suggested_names = [a["name"] for a in alts]
    assert "poha" not in suggested_names
    # idli sambar or dhokla should be suggested
    assert any(name in ["idli sambar", "dhokla"] for name in suggested_names)

# -----------------------------------------------------------------------------
# 8. Voice Phrase Extraction
# -----------------------------------------------------------------------------
def test_voice_food_extraction():
    phrase, conf, src = extract_food_phrase("I had two samosas for lunch")
    assert phrase == "samosa"
    assert conf >= 0.80

    phrase2, conf2, src2 = extract_food_phrase("Two samosas please")
    assert phrase2 == "samosa"
    assert conf2 >= 0.80

    phrase3, conf3, src3 = extract_food_phrase("I am eating dal makhani at a restaurant")
    assert phrase3 == "dal makhani"
    assert src3 == "restaurant"
    assert conf3 >= 0.80

    phrase4, conf4, src4 = extract_food_phrase("I ordered chicken biryani")
    assert phrase4 == "biryani"
    assert src4 == "restaurant"
    assert conf4 >= 0.80

# -----------------------------------------------------------------------------
# 9. Backward Compatibility Endpoints
# -----------------------------------------------------------------------------
def test_legacy_analyze_dish():
    res = client.post("/analyze/dish", json={"dish_name": "samosa", "conditions": ["diabetes"]})
    assert res.status_code == 200
    data = res.json()
    assert "risk_level" in data
    assert "flags" in data
    assert "explanation" in data

def test_legacy_analyze_ingredients():
    res = client.post(
        "/analyze/ingredients",
        json={"ingredients": ["maida", "sugar"], "conditions": ["diabetes"]}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["risk_level"] == "high"

def test_legacy_barcode_not_found():
    res = client.post("/analyze/barcode", json={"barcode": "0000000000000", "conditions": ["diabetes"]})
    assert res.status_code == 200
    data = res.json()
    assert data.get("product_found") is False
    assert data.get("fallback") == "ocr_recommended"

def test_legacy_analyze_menu():
    import base64
    from io import BytesIO
    from PIL import Image, ImageDraw

    img = Image.new('RGB', (800, 400), color='white')
    draw = ImageDraw.Draw(img)
    draw.text((40, 40), "MENU", fill="black")
    draw.text((40, 90), "1. Pav Bhaji - 120", fill="black")
    draw.text((40, 140), "2. Dal Makhani - 220", fill="black")
    buf = BytesIO()
    img.save(buf, format="JPEG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    res = client.post("/analyze/menu", json={
        "image_base64": f"data:image/jpeg;base64,{b64}",
        "conditions": ["diabetes", "hypertension"]
    })
    assert res.status_code == 200
    data = res.json()
    assert "dishes_found" in data
    assert "safest_dish" in data
    assert "avoid_dishes" in data

