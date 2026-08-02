-- Migration: Sprint 2A.1 Access Hardening (Leor)
-- Enhancements: Archived circle check in check_circle_access, CircleAccess ownership validation in RLS, index checks

-- 1. Update check_circle_access with c.is_archived = false check
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
    JOIN public.circles c ON c.id = ca.circle_id
    JOIN public.circle_members cm_target ON cm_target.circle_id = ca.circle_id AND cm_target.user_id = v_owner_user_id
    JOIN public.circle_members cm_viewer ON cm_viewer.circle_id = ca.circle_id AND cm_viewer.user_id = auth.uid()
    WHERE ca.profile_id = p_profile_id
      AND c.is_archived = false
      AND (p_section IS NULL OR ca.section = p_section)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Harden circle_accesses RLS Policies
DROP POLICY IF EXISTS "circle_accesses_insert_policy" ON public.circle_accesses;
CREATE POLICY "circle_accesses_insert_policy" ON public.circle_accesses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.gift_profiles gp WHERE gp.id = profile_id AND gp.user_id = auth.uid())
    AND
    EXISTS (SELECT 1 FROM public.circle_members cm WHERE cm.circle_id = circle_accesses.circle_id AND cm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "circle_accesses_delete_policy" ON public.circle_accesses;
CREATE POLICY "circle_accesses_delete_policy" ON public.circle_accesses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.gift_profiles gp WHERE gp.id = profile_id AND gp.user_id = auth.uid())
    AND
    EXISTS (SELECT 1 FROM public.circle_members cm WHERE cm.circle_id = circle_accesses.circle_id AND cm.user_id = auth.uid())
  );

-- 3. Verify All Performance Indexes
CREATE INDEX IF NOT EXISTS idx_circle_members_user ON public.circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON public.circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_accesses_profile ON public.circle_accesses(profile_id);
CREATE INDEX IF NOT EXISTS idx_circle_accesses_circle_section ON public.circle_accesses(circle_id, section);
CREATE INDEX IF NOT EXISTS idx_circles_owner ON public.circles(owner_id);

COMMENT ON FUNCTION public.check_circle_access IS 'Evaluates active non-archived circle membership and section permissions for profile access';
