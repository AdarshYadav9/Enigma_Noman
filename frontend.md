# Frontend Setup & Documentation

This document outlines the setup, architecture, and technology stack for the Next.js frontend of the Personalized Dietary Risk Alert System.

## 1. Technical Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand (`store/userStore.ts`, `store/trackerStore.ts`)
- **Icons:** Lucide React
- **API Client:** Native `fetch` wrapper (`services/api.ts`)

## 2. Directory Structure

```text
frontend/
├── app/                  # Next.js App Router pages and layouts
│   ├── layout.tsx        # Global layout, including Navbar/Sidebar
│   ├── page.tsx          # Landing page (Condition selection & search)
│   ├── globals.css       # Global Tailwind imports and base styles
│   ├── compare/          # Side-by-side dish comparison
│   ├── history/          # User history
│   ├── profile/          # User profile
│   ├── result/           # Dish/Ingredient Analysis results
│   ├── settings/         # App settings
│   └── tracker/          # Daily intake tracker and meal logs
├── components/           # Reusable UI components
│   ├── BarcodeInput.tsx  # Input for barcode analysis
│   ├── ConditionSelector.tsx # UI to toggle health conditions
│   ├── DailyTracker.tsx  # Dashboard showing daily sodium and meal logs
│   ├── DishSearch.tsx    # Multi-tabbed input (Search, Manual, OCR, Menu, Barcode)
│   ├── HiddenAlertBox.tsx# Accordion for deceptive ingredient warnings
│   ├── MenuOCR.tsx       # Restaurant menu upload and analysis
│   ├── MobileBottomNav.tsx # Mobile navigation bar
│   ├── OCRUploader.tsx   # Packaged food label upload and analysis
│   ├── RiskBadge.tsx     # Colored pill for risk levels (High/Moderate/Low)
│   ├── RiskCard.tsx      # Full analysis display component
│   ├── Sidebar.tsx       # Desktop sidebar navigation
│   └── Topbar.tsx        # Top navigation bar
├── services/
│   └── api.ts            # Typed functions mapping to FastAPI endpoints
├── store/
│   ├── trackerStore.ts   # Zustand store for saving daily meals
│   └── userStore.ts      # Zustand store for user conditions and current analysis
└── types/
    └── index.ts          # TypeScript interfaces (RiskResult, Dish, MealLog, etc.)
```

## 3. Installation & Setup

Ensure you have **Node.js (v18+)** installed.

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

## 4. Environment Variables

If needed in the future, create a `.env.local` file in the `frontend` directory. Currently, the application assumes the backend runs on `http://localhost:8000` (configured in `services/api.ts`).

If your backend is hosted elsewhere, you can modify the `BASE` constant in `api.ts` or expose it via a `.env.local` variable like `NEXT_PUBLIC_API_URL`.

## 5. Key Design Patterns

- **Client Components:** Due to heavy interactivity (Zustand state, file uploads, forms), most components and pages use the `"use client"` directive.
- **Zustand State:** Condition selections and analysis results are kept in global state (`userStore.ts`), allowing users to seamlessly transition from `page.tsx` to `result/page.tsx` without heavy URL query params.
- **Tailwind Utility Classes:** Used extensively for rapid, responsive UI development. Features smooth transitions, hover states, and clear clinical color coding (Red = High Risk, Yellow = Moderate, Green = Safe).
