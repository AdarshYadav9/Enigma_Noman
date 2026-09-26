-- ==============================================================================
-- Personalized Dietary Risk Alert System - Database Schema (Supabase / PostgreSQL)
-- Tables:
--   1. user_health_profiles: Stores authenticated user medical & dietary constraints
--   2. food_analysis_history: Stores historical food risk analyses per user
-- ==============================================================================

-- 1. USER HEALTH PROFILES
CREATE TABLE IF NOT EXISTS public.user_health_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE NOT NULL,
    age INTEGER CHECK (age >= 0 AND age <= 120),
    height_cm NUMERIC CHECK (height_cm >= 50 AND height_cm <= 250),
    allergies JSONB DEFAULT '[]'::jsonb,
    conditions JSONB DEFAULT '[]'::jsonb,
    diseases JSONB DEFAULT '[]'::jsonb,
    health_issues JSONB DEFAULT '[]'::jsonb,
    dietary_restrictions JSONB DEFAULT '[]'::jsonb,
    health_restrictions JSONB DEFAULT '[]'::jsonb,
    doctor_advised_restrictions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_health_profiles_firebase_uid 
    ON public.user_health_profiles(firebase_uid);

-- 2. FOOD ANALYSIS HISTORY
CREATE TABLE IF NOT EXISTS public.food_analysis_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT NOT NULL,
    input_mode TEXT NOT NULL,              -- text, voice, barcode, image, menu
    food_source TEXT NOT NULL,             -- packaged, home, restaurant
    food_name TEXT,
    normalized_food_name TEXT,
    confidence FLOAT,
    risk_level TEXT,                       -- low, moderate, high, unknown
    risk_score INTEGER,                    -- 0 to 100
    result_json JSONB NOT NULL,            -- full structured risk response
    source_image_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_analysis_history_uid 
    ON public.food_analysis_history(firebase_uid);

CREATE INDEX IF NOT EXISTS idx_food_analysis_history_created_at 
    ON public.food_analysis_history(created_at DESC);

-- 3. USERS (Optional User Sync from Firebase Client)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,                   -- Firebase UID
    email TEXT,
    display_name TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Service role & anon policies
DROP POLICY IF EXISTS "Allow all on user_health_profiles" ON public.user_health_profiles;
CREATE POLICY "Allow all on user_health_profiles" 
    ON public.user_health_profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all on food_analysis_history" ON public.food_analysis_history;
CREATE POLICY "Allow all on food_analysis_history" 
    ON public.food_analysis_history FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anon upsert on users" ON public.users;
CREATE POLICY "Allow anon upsert on users" 
    ON public.users FOR ALL TO anon 
    USING (true) 
    WITH CHECK (true);
