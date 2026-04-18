
-- ===== PROFILES (GAMIFICATION) TABLE =====
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    badges JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (but we'll keep it disabled for hackathon simplicity if needed, though profiles should be secure)
-- For now, just disable RLS to match other tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
