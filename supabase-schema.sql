-- CivicPulse Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- ===== COMPLAINTS TABLE =====
CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'user-demo',
    user_name TEXT NOT NULL DEFAULT 'Demo Citizen',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT,
    latitude DOUBLE PRECISION NOT NULL DEFAULT 18.5204,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 73.8567,
    address TEXT NOT NULL DEFAULT 'Pune, Maharashtra',
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    priority_score DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    status TEXT NOT NULL DEFAULT 'SUBMITTED',
    department TEXT NOT NULL DEFAULT 'General Administration',
    assigned_to TEXT,
    upvote_count INTEGER NOT NULL DEFAULT 0,
    upvoted_by JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_resolution TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    -- ===== SENTIMENT ANALYSIS FIELDS =====
    sentiment_label TEXT DEFAULT 'NEUTRAL',
    sentiment_score DOUBLE PRECISION DEFAULT 0.5,
    emotion_tags JSONB DEFAULT '[]'::jsonb,
    empathy_note TEXT DEFAULT ''
);

-- ===== STATUS UPDATES TABLE =====
CREATE TABLE IF NOT EXISTS status_updates (
    id TEXT PRIMARY KEY,
    complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    updated_by TEXT NOT NULL DEFAULT 'admin',
    updated_by_name TEXT NOT NULL DEFAULT 'Admin',
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== FEEDBACKS TABLE =====
CREATE TABLE IF NOT EXISTS feedbacks (
    id TEXT PRIMARY KEY,
    complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT 'user-demo',
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints(department);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_updates_complaint ON status_updates(complaint_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_complaint ON feedbacks(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaints_sentiment ON complaints(sentiment_label);

-- ===== ROW LEVEL SECURITY =====
-- Disable RLS for hackathon demo (enable for production)
ALTER TABLE complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE status_updates DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks DISABLE ROW LEVEL SECURITY;
