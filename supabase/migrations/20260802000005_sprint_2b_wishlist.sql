-- Migration: Sprint 2B Wishlist MVP (Leor)
-- ENUMs: wish_category, wish_priority, wish_status, wish_source, wish_context
-- Tables: wishes
-- Triggers, Indexes, RLS Policies

-- 1. Create PostgreSQL ENUMs
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wish_category') THEN
    CREATE TYPE public.wish_category AS ENUM (
      'TECH', 'BOOKS', 'CLOTHING', 'BEAUTY', 'HOME', 'HOBBY', 'FOOD', 'TRAVEL', 'EXPERIENCE', 'OTHER'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wish_priority') THEN
    CREATE TYPE public.wish_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wish_status') THEN
    CREATE TYPE public.wish_status AS ENUM ('ACTIVE', 'ARCHIVED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wish_source') THEN
    CREATE TYPE public.wish_source AS ENUM ('MANUAL', 'LINK', 'IMPORT');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wish_context') THEN
    CREATE TYPE public.wish_context AS ENUM (
      'BIRTHDAY', 'NEW_YEAR', 'ANNIVERSARY', 'JUST_WANT', 'SOMEDAY', 'OTHER'
    );
  END IF;
END $$;

-- 2. Create Table public.wishes
CREATE TABLE IF NOT EXISTS public.wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CONSTRAINT chk_wishes_title_length CHECK (length(title) <= 120),
  description TEXT CONSTRAINT chk_wishes_description_length CHECK (length(description) <= 1000),
  brand TEXT CONSTRAINT chk_wishes_brand_length CHECK (length(brand) <= 80),
  image_url TEXT,
  link TEXT,
  price NUMERIC(12, 2) CONSTRAINT chk_wishes_price_positive CHECK (price >= 0.0),
  currency TEXT NOT NULL DEFAULT 'RUB',
  category public.wish_category NOT NULL DEFAULT 'OTHER'::public.wish_category,
  priority public.wish_priority NOT NULL DEFAULT 'MEDIUM'::public.wish_priority,
  visibility public.visibility_level NOT NULL DEFAULT 'CIRCLE'::public.visibility_level,
  status public.wish_status NOT NULL DEFAULT 'ACTIVE'::public.wish_status,
  source_type public.wish_source NOT NULL DEFAULT 'MANUAL'::public.wish_source,
  context public.wish_context NOT NULL DEFAULT 'JUST_WANT'::public.wish_context,
  is_surprise_friendly BOOLEAN NOT NULL DEFAULT true,
  size_override TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Trigger updated_at
DROP TRIGGER IF EXISTS trg_wishes_set_updated_at ON public.wishes;
CREATE TRIGGER trg_wishes_set_updated_at
  BEFORE UPDATE ON public.wishes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_wishes_user ON public.wishes (user_id);
CREATE INDEX IF NOT EXISTS idx_wishes_status ON public.wishes (status);
CREATE INDEX IF NOT EXISTS idx_wishes_priority ON public.wishes (priority);

-- 5. Enable RLS and Policies
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishes_select_policy" ON public.wishes;
CREATE POLICY "wishes_select_policy" ON public.wishes
  FOR SELECT USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.gift_profiles gp
      WHERE gp.user_id = wishes.user_id
        AND public.can_view_profile(gp.id, 'WISHLIST'::public.profile_section)
    )
  );

DROP POLICY IF EXISTS "wishes_insert_policy" ON public.wishes;
CREATE POLICY "wishes_insert_policy" ON public.wishes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishes_update_policy" ON public.wishes;
CREATE POLICY "wishes_update_policy" ON public.wishes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishes_delete_policy" ON public.wishes;
CREATE POLICY "wishes_delete_policy" ON public.wishes
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.wishes IS 'User wishes and gift cards';
