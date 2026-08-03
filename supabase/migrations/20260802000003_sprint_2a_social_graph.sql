-- Migration: Sprint 2A Social Graph (Leor)
-- Tables: circles, circle_members, circle_accesses
-- ENUMs: circle_role, profile_section
-- Functions: handle_circle_owner_member, check_circle_access, can_view_profile

-- 1. Create ENUMs
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'circle_role') THEN
    CREATE TYPE public.circle_role AS ENUM ('OWNER', 'MEMBER');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_section') THEN
    CREATE TYPE public.profile_section AS ENUM ('BASIC_INFO', 'INTERESTS', 'SIZES', 'WISHLIST', 'MEMORIES');
  END IF;
END $$;

-- 2. Create Tables
CREATE TABLE IF NOT EXISTS public.circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CONSTRAINT chk_circles_name_length CHECK (length(name) <= 100),
  avatar_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.circle_role NOT NULL DEFAULT 'MEMBER'::public.circle_role,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_circle_members_circle_user UNIQUE (circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.circle_accesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.gift_profiles(id) ON DELETE CASCADE,
  section public.profile_section NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_circle_accesses_circle_profile_section UNIQUE (circle_id, profile_id, section)
);

-- 3. Automatic Owner Member Trigger
CREATE OR REPLACE FUNCTION public.handle_circle_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.circle_members (circle_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'OWNER'::public.circle_role)
  ON CONFLICT (circle_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_circles_auto_owner ON public.circles;
CREATE TRIGGER trg_circles_auto_owner
  AFTER INSERT ON public.circles
  FOR EACH ROW EXECUTE FUNCTION public.handle_circle_owner_member();

-- 4. Create Required Indexes
CREATE INDEX IF NOT EXISTS idx_circle_members_user ON public.circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON public.circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_accesses_profile ON public.circle_accesses(profile_id);
CREATE INDEX IF NOT EXISTS idx_circle_accesses_circle_section ON public.circle_accesses(circle_id, section);
CREATE INDEX IF NOT EXISTS idx_circles_owner ON public.circles(owner_id);

-- 5. Updated check_circle_access and can_view_profile Functions
DROP FUNCTION IF EXISTS public.check_circle_access(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.check_circle_access(UUID, public.profile_section) CASCADE;
DROP FUNCTION IF EXISTS public.can_view_profile(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.can_view_profile(UUID, public.profile_section) CASCADE;

CREATE OR REPLACE FUNCTION public.check_circle_access(
  p_profile_id UUID,
  p_section public.profile_section DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_owner_user_id UUID;
BEGIN
  SELECT user_id INTO v_owner_user_id
  FROM public.gift_profiles
  WHERE id = p_profile_id;

  IF v_owner_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.circle_accesses ca
    JOIN public.circle_members cm_target ON cm_target.circle_id = ca.circle_id AND cm_target.user_id = v_owner_user_id
    JOIN public.circle_members cm_viewer ON cm_viewer.circle_id = ca.circle_id AND cm_viewer.user_id = auth.uid()
    WHERE ca.profile_id = p_profile_id
      AND (p_section IS NULL OR ca.section = p_section)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_view_profile(
  p_profile_id UUID,
  p_section public.profile_section DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_owner_user_id UUID;
BEGIN
  SELECT user_id INTO v_owner_user_id FROM public.gift_profiles WHERE id = p_profile_id;

  IF v_owner_user_id IS NOT NULL AND v_owner_user_id = auth.uid() THEN
    RETURN TRUE;
  END IF;

  IF public.check_circle_access(p_profile_id, p_section) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 6. Enable RLS on Circles tables
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_accesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for circles
DROP POLICY IF EXISTS "circles_select_policy" ON public.circles;
CREATE POLICY "circles_select_policy" ON public.circles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.circle_members cm WHERE cm.circle_id = id AND cm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "circles_insert_policy" ON public.circles;
CREATE POLICY "circles_insert_policy" ON public.circles
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "circles_update_policy" ON public.circles;
CREATE POLICY "circles_update_policy" ON public.circles
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "circles_delete_policy" ON public.circles;
CREATE POLICY "circles_delete_policy" ON public.circles
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for circle_members
DROP POLICY IF EXISTS "circle_members_select_policy" ON public.circle_members;
CREATE POLICY "circle_members_select_policy" ON public.circle_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.circle_members cm WHERE cm.circle_id = circle_members.circle_id AND cm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "circle_members_insert_policy" ON public.circle_members;
CREATE POLICY "circle_members_insert_policy" ON public.circle_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.circles c WHERE c.id = circle_id AND c.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "circle_members_delete_policy" ON public.circle_members;
CREATE POLICY "circle_members_delete_policy" ON public.circle_members
  FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.circles c WHERE c.id = circle_id AND c.owner_id = auth.uid())
  );

-- RLS Policies for circle_accesses
DROP POLICY IF EXISTS "circle_accesses_select_policy" ON public.circle_accesses;
CREATE POLICY "circle_accesses_select_policy" ON public.circle_accesses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.circle_members cm WHERE cm.circle_id = circle_accesses.circle_id AND cm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "circle_accesses_insert_policy" ON public.circle_accesses;
CREATE POLICY "circle_accesses_insert_policy" ON public.circle_accesses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.gift_profiles gp WHERE gp.id = profile_id AND gp.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "circle_accesses_delete_policy" ON public.circle_accesses;
CREATE POLICY "circle_accesses_delete_policy" ON public.circle_accesses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.gift_profiles gp WHERE gp.id = profile_id AND gp.user_id = auth.uid())
  );

COMMENT ON TABLE public.circles IS 'User created social circles';
COMMENT ON TABLE public.circle_members IS 'Members of circles with roles (OWNER, MEMBER)';
COMMENT ON TABLE public.circle_accesses IS 'Section permissions granted by profiles to circles';
