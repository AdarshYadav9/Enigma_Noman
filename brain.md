# PS1: Personalized Hidden-Ingredient & Dietary Risk Alert System
## Project Brain 🧠

This document serves as the central knowledge base for the Personalized Dietary Risk Alert System. It details the architecture, feature sets, technical stack, file structure, and setup instructions.

---

## 1. Overview
This system helps patients with specific dietary conditions (e.g., Diabetes, Hypertension, CKD, PCOS, Allergies) understand the hidden risks in the food they consume. Users can search for Indian dishes or input raw ingredients manually (or via OCR), and the system highlights high and moderate-risk ingredients, issues sodium warnings, and flags deceptive "hidden ingredients".

---

## 2. Technical Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI
- **Language:** Python 3.14
- **OCR Engine:** Pytesseract (Tesseract-OCR) + Pillow
- **Server:** Uvicorn

---

## 3. Application Architecture

The system follows a decoupled Client-Server architecture. The Next.js frontend acts as the user interface, reading and writing state into a centralized Zustand store. When the user analyzes a dish, the frontend fires a REST API call to the FastAPI backend, which runs the logic against its JSON data stores and returns a standardized `RiskResult`.

### File Structure
```
genesis/
├── backend/
│   ├── main.py                  # FastAPI Application and Routes
│   ├── risk_engine.py           # Core logic for analyzing ingredients
│   ├── ocr_service.py           # Base64 image to text extraction
│   ├── requirements.txt         # Python dependencies
│   └── data/
│       ├── condition_risks.json # Dictionary of dietary limits and risks
│       └── indian_dishes.json   # Database of dishes and their properties
│
└── frontend/
    ├── app/
    │   ├── layout.tsx           # Global Next.js Layout
    │   ├── page.tsx             # Landing Page (Selection & Search)
    │   ├── globals.css          # Global Tailwind styles
    │   └── result/
    │       └── page.tsx         # Results & Analysis Display Page
    ├── components/
    │   ├── ConditionSelector.tsx# UI to select health conditions
    │   ├── DishSearch.tsx       # UI to search dishes or input manually
    │   ├── RiskCard.tsx         # Renders the full risk analysis
    │   ├── RiskBadge.tsx        # High/Moderate/Low pill badge
    │   └── HiddenAlertBox.tsx   # Expandable box for hidden terms
    ├── store/
    │   └── userStore.ts         # Zustand Global State
    ├── types/
    │   └── index.ts             # TypeScript Interfaces (RiskResult, Dish, etc.)
    └── services/
        └── api.ts               # fetch wrappers for backend endpoints
```

---

## 4. Implemented Features & Core Logic

### Implemented Features
- **Multi-Condition Dietary Analysis:** Users can select one or multiple health conditions simultaneously (e.g., Diabetes + Hypertension). The system aggregates risks for all selected profiles.
- **Dish Database Search:** A debounced search bar allowing users to quickly find common Indian dishes (like "pav bhaji" or "biryani") and analyze their default ingredient profiles.
- **Manual Ingredient Input:** Users can manually type a comma-separated list of ingredients to analyze custom recipes or specific food items not in the database.
- **Hidden Ingredient Decoder:** Automatically scans ingredients for deceptive marketing terms (e.g., "edible starch", "natural flavours") and translates them into plain-English health warnings.
- **Sodium Warning System:** Automatically tracks the total sodium per dish against the combined maximum safe daily intake thresholds for the user's selected conditions.
- **Visual Risk Badges:** Clear UI indicators summarizing the meal into 🔴 HIGH RISK, 🟡 MODERATE RISK, or 🟢 LOW RISK based on the worst-offending ingredient.
- **Safe Ingredients List:** Highlights the ingredients in the meal that are perfectly safe to consume, giving the user actionable dietary encouragement.
- **OCR API Endpoint Ready:** A backend endpoint (`/analyze/ocr`) is fully implemented to extract ingredients from food label images via Tesseract-OCR.

### A. The Risk Engine (`risk_engine.py`)
When a dish is analyzed, the engine:
1. Loops over the user's **selected conditions**.
2. Checks each ingredient against the `high` and `moderate` risk arrays for those conditions.
3. Calculates the total **Sodium** consumption against the `sodium_safe_mg` thresholds for those conditions.
4. Generates **Hidden Ingredient Alerts** by cross-referencing a dictionary of misleading food industry terms (e.g., "edible starch", "natural flavours").
5. Determines the overall `risk_level` (`high`, `moderate`, or `low`).

### B. OCR Service (`ocr_service.py`)
Users can (via future frontend integration) upload an image of a food label.
1. The backend receives a Base64 encoded string.
2. It uses `pytesseract` to extract all text.
3. A Regex searches for the keyword "ingredients" and parses out the following comma-separated list.
*Note: Includes a monkey-patch for `pkgutil.find_loader` to maintain Python 3.14 compatibility.*

---

## 5. API Endpoints

Base URL: `http://localhost:8000`

### `GET /health`
- **Purpose:** Checks if the API is running.
- **Returns:** `{"status": "ok"}`

### `GET /dish/search?q={query}`
- **Purpose:** Searches the local dish database (`indian_dishes.json`) by name.
- **Returns:** `List[Dish]`

### `POST /analyze/dish`
- **Payload:** `{ "dish_name": "pav bhaji", "conditions": ["diabetes"] }`
- **Purpose:** Analyzes a specific dish from the database based on selected conditions.
- **Returns:** `RiskResult`

### `POST /analyze/ingredients`
- **Payload:** `{ "ingredients": ["maida", "salt"], "conditions": ["hypertension"] }`
- **Purpose:** Analyzes a custom, manual list of ingredients.
- **Returns:** `RiskResult`

### `POST /analyze/ocr`
- **Payload:** `{ "image_base64": "...", "conditions": ["ckd"] }`
- **Purpose:** Extracts ingredients from an image and analyzes them.
- **Returns:** `RiskResult` (including `ingredients_found` array)

---

## 6. How to Run Locally

### Prerequisites
- Node.js (v18+)
- Python 3.14+
- Tesseract-OCR installed on the system (for image scanning).

### Step 1: Start Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Step 2: Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) to use the application.

---

## 7. Future Expansions & Roadmap
- **User Authentication:** Save user profiles and condition presets.
- **Database Integration:** Move from `.json` files to PostgreSQL or MongoDB for scalable dish additions.
- **Upload UI:** Implement the drag-and-drop file uploader in the frontend to utilize the `/analyze/ocr` endpoint.
- **Barcode Scanner:** Integrate external APIs (like OpenFoodFacts) via barcode scanning to automatically fetch ingredients.
