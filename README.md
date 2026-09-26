# PS1: Personalized Dietary Risk Alert System

## Backend
The backend is built with FastAPI. It performs risk analysis on ingredients and uses OCR to extract ingredients from images.

### Start the Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Frontend
The frontend is built with Next.js 14 and Tailwind CSS.

### Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
