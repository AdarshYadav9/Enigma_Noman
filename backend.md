# Backend Architecture & Documentation — Personalized Dietary Risk Alert System

This document outlines the architecture, technology stack, data models, and API endpoints for the Python FastAPI backend of the Personalized Dietary Risk Alert System.

## 1. Technical Stack

- **Framework:** FastAPI (Python 3.12+)
- **Server:** Uvicorn
- **Data Validation & Schemas:** Pydantic v2
- **Authentication:** Firebase Admin SDK (ID token verification via `Authorization: Bearer <firebase_id_token>`)
- **Database & Storage:** Supabase PostgreSQL (`supabase-py` client)
- **Voice Transcription (STT):** Sarvam AI (`saaras:v3` model, `transcribe` mode)
- **OCR Engine:** Tesseract-OCR (via `pytesseract` and `Pillow`)
- **External APIs:** OpenFoodFacts API via `httpx`
- **Matching & Normalization:** `rapidfuzz` & Unicode normalization

## 2. Directory Structure

```text
backend/
├── data/
│   ├── condition_risks.json      # Health condition limits & high/moderate risk ingredients
│   ├── indian_dishes.json        # Database of dishes with ingredients, sodium, and carbs
│   ├── food_aliases.json         # Transliteration and alias mappings for Indian dishes
│   ├── food_alternatives.json    # Verified healthier alternatives mapping
│   └── ingredient_aliases.json   # Allergen synonyms and ambiguous/hidden terms
│
├── services/
│   ├── food_service.py           # Food normalization, alias resolution, confidence categorization
│   ├── alternative_service.py    # Personalized safe alternative food generator
│   ├── sarvam_service.py         # Sarvam AI STT & food phrase extraction
│   ├── pipeline_service.py       # Central unified food analysis pipeline
│   ├── ocr_service.py            # OCR processing logic using pytesseract
│   └── risk_engine.py            # Personalized multi-factor risk engine + legacy backward compatibility
│
├── models/
│   ├── profile_models.py         # User health profile Pydantic models with range validation
│   ├── food_models.py            # Food and alternative analysis request models
│   └── response_models.py        # Standard unified response models
│
├── db/
│   ├── schema.sql                # Supabase PostgreSQL schema definition
│   ├── supabase_client.py        # Singleton Supabase client initialization
│   └── repositories.py           # Data access repository for profiles and food analysis history
│
├── auth/
│   └── firebase_auth.py          # Firebase token verification & get_current_user dependency
│
├── tests/
│   └── test_backend.py           # Automated test suite (18 test cases)
│
├── config.py                     # Environment configuration and logging
├── risk_config.py                # Centralized risk scoring weights and thresholds
├── main.py                       # FastAPI application and route definitions
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment variable template
└── .env                          # Local secrets configuration
```

## 3. Database Schema (`db/schema.sql`)

The backend stores user profiles and historical assessments in Supabase:

1. **`user_health_profiles`**:
   - `id`: UUID (Primary Key)
   - `firebase_uid`: TEXT (Unique, Indexed)
   - `age`: INTEGER (0 to 120)
   - `height_cm`: NUMERIC (50 to 250)
   - `allergies`: JSONB (e.g. `["peanut", "shellfish"]`)
   - `conditions`: JSONB (e.g. `["diabetes", "hypertension"]`)
   - `diseases`: JSONB
   - `health_issues`: JSONB
   - `dietary_restrictions`: JSONB (e.g. `["vegetarian"]`)
   - `health_restrictions`: JSONB (e.g. `["low sodium"]`)
   - `doctor_advised_restrictions`: JSONB
   - `created_at`, `updated_at`: TIMESTAMPTZ

2. **`food_analysis_history`**:
   - `id`: UUID (Primary Key)
   - `firebase_uid`: TEXT (Indexed)
   - `input_mode`: TEXT (`text`, `voice`, `barcode`, `image`, `menu`)
   - `food_source`: TEXT (`home`, `restaurant`, `packaged`)
   - `food_name`: TEXT
   - `normalized_food_name`: TEXT
   - `confidence`: FLOAT (0.0 to 1.0)
   - `risk_level`: TEXT (`low`, `moderate`, `high`, `unknown`)
   - `risk_score`: INTEGER (0 to 100)
   - `result_json`: JSONB (Complete structured result)
   - `source_image_path`: TEXT (Optional)
   - `created_at`: TIMESTAMPTZ (Indexed DESC)

## 4. Transparent Risk Scoring System (`risk_config.py`)

The risk score is a rule-based prioritization indicator (0–100), **NOT** a clinical disease probability:
- **Critical allergen conflict:** `+60`
- **High-risk ingredient conflict:** `+30`
- **Moderate-risk ingredient conflict:** `+15`
- **High sodium conflict:** `+15`
- **High sugar conflict:** `+15`
- **User dietary/doctor restriction conflict:** `+20`
- **Score Cap:** 0 to 100
- **Risk Levels:**
  - `high`: Score >= 50, critical allergen conflict, high-risk ingredient, or exceeded sodium/condition limits.
  - `moderate`: Score 20 to 49, moderate-risk ingredients.
  - `low`: Score < 20 and food/ingredients reliably identified with no conflicts.
  - `unknown`: Food not reliably recognized or ingredient list unavailable.

### Uncertainty & No Hallucination System
- `confirmed` (0.90 – 1.00)
- `likely` (0.70 – 0.89)
- `uncertain` (0.40 – 0.69)
- `unknown` (0.00 – 0.39)
If a food or ingredient list cannot be verified, the API returns:
```json
{
  "status": "unknown",
  "message": "I’m not sure about this food or item.",
  "reason": "No reliable food match or ingredient information was found.",
  "risk": {"level": "unknown", "score": null}
}
```

## 5. API Endpoints

### Health & System
- `GET /health` — Health check status and version.
- `GET /dish/search?q={query}` — Search Indian dishes by substring.

### User Health Profile (Authenticated with Bearer token)
- `GET /profile` — Retrieve authenticated user's health profile.
- `POST /profile` — Create health profile.
- `PUT /profile` — Update health profile.
- `DELETE /profile` — Delete health profile.

### Unified Food Analysis (Authenticated)
- `POST /food/analyze` — Analyze food name (text/home/restaurant) against profile with optional user ingredients.
- `POST /food/voice` — Upload audio recording (multipart/form-data) transcribed with Sarvam AI `saaras:v3` and analyzed against profile.
- `POST /food/alternative` — Retrieve personalized healthier food alternatives for high-risk foods, pre-filtered against the user's profile.

### Food History (Authenticated)
- `GET /food/history?limit=20&offset=0` — Retrieve paginated food analysis history.
- `GET /food/history/{analysis_id}` — Retrieve full details of a specific past analysis.

### Backward-Compatible Endpoints (Preserved)
- `POST /analyze/dish` — Original dish analysis (optionally accepts Firebase token for profile enhancement).
- `POST /analyze/ingredients` — Original ingredient list analysis.
- `POST /analyze/ocr` — Original packaging label OCR and analysis.
- `POST /analyze/barcode` — OpenFoodFacts product lookup and analysis.
- `POST /analyze/menu` — OCR on restaurant menu and safest dish recommendation.

## 6. Environment Variables (`.env.example`)

```bash
FIREBASE_PROJECT_ID=noman-64792
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

SUPABASE_URL=https://bpqgpdckrmkdbyzfvwpf.supabase.co
SUPABASE_KEY=
DATABASE_URL=

SARVAM_API_KEY=

OPENFOODFACTS_BASE_URL=https://world.openfoodfacts.org
```

## 7. Running the Tests

To run the automated test suite covering all 9 implementation phases:

```bash
cd backend
source venv/bin/activate
pytest -o pythonpath=. tests/
```
