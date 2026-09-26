# Backend Setup & Documentation

This document outlines the setup, architecture, and technology stack for the Python FastAPI backend of the Personalized Dietary Risk Alert System.

## 1. Technical Stack

- **Framework:** FastAPI (Python)
- **Server:** Uvicorn
- **Data Validation:** Pydantic
- **OCR Engine:** Tesseract-OCR (via `pytesseract` and `Pillow`)
- **External APIs:** `httpx` for querying the OpenFoodFacts API

## 2. Directory Structure

```text
backend/
├── data/
│   ├── condition_risks.json  # Mapping of health conditions to high/moderate risk ingredients
│   └── indian_dishes.json    # Database of dishes with ingredients, sodium, and carbs
├── main.py                   # FastAPI application and route definitions
├── ocr_service.py            # OCR processing logic using pytesseract
├── requirements.txt          # Python dependencies
├── risk_engine.py            # Core logic for analyzing ingredient safety and flags
└── venv/                     # Python virtual environment
```

## 3. Core Functionalities

### Risk Engine (`risk_engine.py`)
- Analyzes a list of ingredients against selected health conditions using `data/condition_risks.json`.
- Flags ingredients as "high" or "moderate" risk and builds a safe list.
- Checks sodium levels against condition-specific limits.
- Detects deceptive / hidden terms (e.g., "natural flavours", "edible starch") to alert users.

### OCR Service (`ocr_service.py`)
- Takes a base64 encoded image.
- Uses Tesseract OCR to extract text from images (like food labels or menus).
- Parses "ingredients" lists from packaging and cleans them for the risk engine.

### Barcode Scanning
- Relies on the Open Food Facts API to retrieve product ingredients and nutritional data from a barcode.

## 4. API Endpoints

- `GET /health` - Health check.
- `GET /dish/search?q={query}` - Search for a dish by name.
- `POST /analyze/dish` - Analyze risk for a specific known dish.
- `POST /analyze/ingredients` - Analyze risk for a provided list of ingredients.
- `POST /analyze/ocr` - Extract ingredients from an image of a food label and analyze them.
- `POST /analyze/barcode` - Fetch data for a barcode and analyze it.
- `POST /analyze/menu` - Perform OCR on a restaurant menu and match dishes to analyze them.

## 5. Installation & Setup

1. **Install System Dependencies:**
   Ensure you have `tesseract` installed on your system.
   - **macOS:** `brew install tesseract`
   - **Linux:** `sudo apt install tesseract-ocr`
   - **Windows:** Download the installer from the official repository and ensure the path is correct.

2. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

3. **Activate the Virtual Environment:**
   - **macOS/Linux:** `source venv/bin/activate`
   - **Windows:** `venv\Scripts\activate`
   *(If the venv folder doesn't exist, create it using `python3 -m venv venv`)*

4. **Install Python Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the Server:**
   ```bash
   uvicorn main:app --reload
   ```
   The backend will run on `http://127.0.0.1:8000`.
