# PS1: Personalized Dietary Risk Alert System

An intelligent, multi-modal personalized dietary risk alert system designed to help individuals with chronic conditions (such as Hypertension, Diabetes, Chronic Kidney Disease, PCOS, and severe food allergies) make safe, informed nutritional choices in real time.

---

## 👥 Team Information

* **Team Name:** Team Noman
* **Team Members:**
  * **Adarsh Yadav**
  * **Aman Prajapati**
  * **Hritika Das**
  * **Shivam Tiwari**

---

## 🎯 Problem Statement

**PS1: Personalized Dietary Risk Alert System**

Standard health and nutrition trackers rely on one-size-fits-all static calorie models, manual typing, and barcode-only databases. They fail to protect users with specific chronic conditions from critical dietary risks (such as dangerous sodium spikes for hypertension patients, hidden sugars for diabetics, or trace allergens). Furthermore, generic generative AI chatbots often hallucinate non-deterministic and potentially hazardous medical advice.

### Our Solution
A **deterministic, zero-hallucination clinical conflict engine (0–100 risk score)** coupled with a **360° multi-modal ingestion pipeline** (English Voice via Sarvam AI, Barcode Scanner, Packaged Food OCR, and Restaurant Menu OCR) that cross-references food ingredients against an authenticated user's dynamic health profile.

---

## ⚡ Key Features

1. **Deterministic Rule-Based Risk Engine (0–100 Conflict Score):**
   * Multi-tiered penalty structure: Critical Allergens (+60), Condition-Specific Thresholds (+30), and Doctor-Advised Restrictions (+20).
   * Fully auditable, zero-hallucination clinical logic.

2. **360° Multi-Modal Food Ingestion:**
   * **Voice Input (Sarvam AI):** Hands-free "Tap to Speak" English speech transcription powered by Sarvam AI (`saaras:v3`).
   * **Packaged Food OCR:** Client-side optimized camera scanner reading ingredient labels with Tesseract OCR.
   * **Restaurant Menu OCR:** Multi-column layout parser with price and bullet-point stripping, categorizing items into *Safer Selection* vs. *Requires Caution*.
   * **Barcode Scanner:** Instant packaged product lookup integrated with OpenFoodFacts.
   * **Interactive Text Search:** Real-time dish matching across canonical dishes and regional recipes.

3. **Hyper-Localized Indian & Regional Food Normalization:**
   * Built-in alias resolution engine powered by `rapidfuzz` and dedicated datasets (`indian_dishes.json` & `food_aliases.json`).

4. **Dynamic Health-Profile Driven Daily Intake Tracker:**
   * Automatically sets personalized ceilings (e.g., $1500\,\text{mg}$ sodium ceiling for Hypertension, $130\,\text{g}$ carbohydrates target for Diabetes).
   * Real-time progress gauges with persistent local storage.

5. **Personalized Safe Food Alternatives:**
   * Proactively recommends healthy substitute meals with zero conflicts for high-risk detected items.

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** Next.js (App Router, Turbopack, TypeScript)
* **Styling:** Tailwind CSS, Lucide React Icons
* **State Management:** Zustand (with `persist` middleware)
* **Authentication:** Firebase Client SDK
* **Media & Processing:** HTML5 MediaRecorder API, In-Browser Canvas Image Preprocessing

### Backend
* **Framework:** FastAPI (Python 3.12), Uvicorn ASGI
* **Validation & Schemas:** Pydantic v2
* **OCR & Vision:** Tesseract OCR (`pytesseract`), Pillow, OpenCV
* **Voice AI:** Sarvam AI SDK / REST API (`saaras:v3`)
* **Data & Normalization:** RapidFuzz, Custom Indian Food & Alias Datasets
* **Database & Storage:** Supabase (PostgreSQL with Row Level Security)
* **Authentication:** Firebase Admin SDK (JWT Bearer Verification)
* **Testing:** Pytest, AnyIO

---

## 🚀 Setup & Installation Guide

### Prerequisites
* **Node.js** (v18.17+ or v20+)
* **Python** (v3.10, v3.11, or v3.12)
* **Tesseract OCR** installed on your system:
  * **macOS (Homebrew):** `brew install tesseract`
  * **Ubuntu / Debian:** `sudo apt-get update && sudo apt-get install -y tesseract-ocr`
  * **Windows:** Download and install from [UB-Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki) and add to PATH.

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

Open `backend/.env` and provide your credentials:
```env
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_KEY=<your-supabase-service-role-or-anon-key>
SARVAM_API_KEY=<your-sarvam-ai-api-key>
FIREBASE_PROJECT_ID=<your-firebase-project-id>
```

#### Run Database Migrations
Run the SQL schema located at `backend/db/schema.sql` in your **Supabase SQL Editor** to initialize the `user_health_profiles` and `food_analysis_history` tables.

#### Start Backend Server
```bash
uvicorn main:app --reload --port 8000
```
Backend API will be running at `http://127.0.0.1:8000`  
Interactive Swagger docs: `http://127.0.0.1:8000/docs`

#### Run Backend Tests
```bash
PYTHONPATH=. pytest tests/ -v
```

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

Open `frontend/.env.local` and add your Firebase and API configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=<your-firebase-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
```

#### Start Frontend Development Server
```bash
npm run dev
```
Frontend will be running at `http://localhost:3000`

---

## 🚢 Production Deployment Options (Deployment Ready)

This repository is pre-configured and hardened for production deployment using Docker, Docker Compose, or PaaS providers (Render, Railway, Cloud Run, Vercel).

> **Note:** The instructions below demonstrate how to build and launch production instances. Do not run live deployment commands until you are ready to release.

### Option A: One-Command Local / VPS Deployment (Docker Compose)
Both the frontend and backend are containerized with multi-stage builds, non-root security users, and automatic healthchecks.

1. Ensure your `.env` files are configured:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```
2. Build and start the unified stack:
   ```bash
   docker compose up --build
   ```
3. Access:
   - **Frontend UI:** `http://localhost:3000`
   - **Backend API:** `http://localhost:8000`
   - **Backend Healthcheck:** `http://localhost:8000/health`

---

### Option B: Cloud PaaS Deployment

#### 1. Backend (FastAPI + Tesseract OCR)
Deployable to **Render**, **Railway**, **Google Cloud Run**, or **AWS App Runner**:
* **Build Method:** Dockerfile (uses `backend/Dockerfile` with pre-installed Tesseract C++ binaries).
* **Port:** `$PORT` (defaults to `8000`).
* **Health Check Path:** `/health`.
* **Required Environment Variables:**
  * `SUPABASE_URL`
  * `SUPABASE_KEY`
  * `SARVAM_API_KEY`
  * `FIREBASE_PROJECT_ID`
  * `ALLOWED_ORIGINS` (set to your production frontend URL, e.g. `https://your-app.vercel.app`)

#### 2. Frontend (Next.js App)
Deployable to **Vercel**, **Netlify**, or **Render**:
* **Root Directory:** `frontend`
* **Build Command:** `npm run build`
* **Output Directory:** `.next`
* **Required Environment Variables:**
  * `NEXT_PUBLIC_API_URL` (points to your deployed backend URL, e.g., `https://api.yourdomain.com`)
  * `NEXT_PUBLIC_FIREBASE_API_KEY`
  * `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  * `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  * `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  * `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  * `NEXT_PUBLIC_FIREBASE_APP_ID`

---

### Option C: Infrastructure-as-Code via Render Blueprint
A ready-to-use [`render.yaml`](file:///Users/apple/Desktop/genesis/render.yaml) blueprint is included at the project root for automated dual-service deployment.

---

## 📋 System Architecture

```text
                     ┌────────────────────────────────┐
                     │    Next.js 14 Frontend UI      │
                     │  (Voice, Camera, Menu, Search) │
                     └───────────────┬────────────────┘
                                     │ REST / JSON / FormData
                                     ▼
                     ┌────────────────────────────────┐
                     │        FastAPI Backend         │
                     │  (Firebase Auth Verification)  │
                     └───────┬───────────────┬────────┘
                             │               │
            ┌────────────────┴──────┐ ┌──────┴────────────────┐
            ▼                       ▼ ▼                       ▼
  ┌──────────────────┐    ┌──────────────────┐      ┌──────────────────┐
  │   Sarvam AI STT  │    │  Tesseract OCR   │      │  Risk & Conflict │
  │   (saaras:v3)    │    │ (Labels & Menus) │      │  Engine (0-100)  │
  └──────────────────┘    └──────────────────┘      └────────┬─────────┘
                                                             │
                                                             ▼
                                                    ┌──────────────────┐
                                                    │  Supabase (Post- │
                                                    │  greSQL DB & RLS)│
                                                    └──────────────────┘
```

---

## 🛡️ License & Disclaimer

* **Disclaimer:** This system is an informative, rule-based dietary conflict screening tool and is **not** a substitute for certified medical advice, diagnosis, or personalized clinical treatment.
