-- Migration: Sprint 1.2 Foundation Freeze (Leor)
-- Enhancements: Sectional Privacy in can_view_profile, search_path hardening, explicit SELECT/INSERT/UPDATE/DELETE RLS policies, check_circle_access stub, gift_profile_public view

-- 1. Create check_circle_access stub function (prepared for Sprint 2)
CREATE OR REPLACE FUNCTION public.check_circle_access(
  p_profile_id UUID,
  p_section TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Stub for Sprint 2 Circle Access system.
  -- Will check circle_memberships and section permissions (BASIC_INFO, INTERESTS, SIZES, WISHLIST, MEMORIES)
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Update can_view_profile with sectional privacy support & hardened search_path
CREATE OR REPLACE FUNCTION public.can_view_profile(
  p_profile_id UUID,
  p_section TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_owner_user_id UUID;
BEGIN
  -- Retrieve user_id of profile owner
  SELECT user_id INTO v_owner_user_id
  FROM public.gift_profiles
  WHERE id = p_profile_id;

  -- 1. Owner can always access all sections of their profile
  IF v_owner_user_id IS NOT NULL AND v_owner_user_id = auth.uid() THEN
    RETURN TRUE;
  END IF;

  -- 2. Check Circle Access stub (returns false for now, active in Sprint 2)
  IF public.check_circle_access(p_profile_id, p_section) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 3. Harden calculate_profile_completeness with search_path = public
CREATE OR REPLACE FUNCTION public.calculate_profile_completeness(p_profile_id UUID)
RETURNS INT AS $$
DECLARE
  v_user_id UUID;
  v_first_name TEXT;
  v_bio TEXT;
  v_birth_date DATE;
  v_city TEXT;
  v_taste_count INT;
  v_size_count INT;
  v_score INT := 0;
BEGIN
  SELECT user_id, bio, birth_date, city INTO v_user_id, v_bio, v_birth_date, v_city
  FROM public.gift_profiles WHERE id = p_profile_id;
  
  IF v_user_id IS NULL THEN 
    RETURN 0; 
  END IF;
  
  SELECT first_name INTO v_first_name FROM public.users WHERE id = v_user_id;
  
  IF v_first_name IS NOT NULL AND length(trim(v_first_name)) > 0 THEN v_score := v_score + 10; END IF;
  IF v_bio IS NOT NULL AND length(trim(v_bio)) > 0 THEN v_score := v_score + 10; END IF;
  IF v_birth_date IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_city IS NOT NULL AND length(trim(v_city)) > 0 THEN v_score := v_score + 10; END IF;
  
  SELECT COUNT(*) INTO v_taste_count FROM public.taste_items WHERE profile_id = p_profile_id;
  IF v_taste_count >= 1 THEN v_score := v_score + 15; END IF;
  IF v_taste_count >= 3 THEN v_score := v_score + 15; END IF;
  
  SELECT COUNT(*) INTO v_size_count FROM public.profile_sizes WHERE profile_id = p_profile_id;
  IF v_size_count >= 1 THEN v_score := v_score + 15; END IF;
  IF v_size_count >= 3 THEN v_score := v_score + 15; END IF;
  
  RETURN LEAST(100, v_score);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 4. Re-architect RLS Policies: Separate SELECT, INSERT, UPDATE, DELETE policies

-- gift_profiles
DROP POLICY IF EXISTS "Users can view their own gift profile" ON public.gift_profiles;
DROP POLICY IF EXISTS "Users can insert their own gift profile" ON public.gift_profiles;
DROP POLICY IF EXISTS "Users can update their own gift profile" ON public.gift_profiles;

CREATE POLICY "gift_profiles_select_policy" ON public.gift_profiles
  FOR SELECT USING (public.can_view_profile(id, 'BASIC_INFO'));

CREATE POLICY "gift_profiles_insert_policy" ON public.gift_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gift_profiles_update_policy" ON public.gift_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- profile_sizes
DROP POLICY IF EXISTS "Users can manage their profile sizes" ON public.profile_sizes;
DROP POLICY IF EXISTS "profile_sizes_select_policy" ON public.profile_sizes;
DROP POLICY IF EXISTS "profile_sizes_insert_policy" ON public.profile_sizes;
DROP POLICY IF EXISTS "profile_sizes_update_policy" ON public.profile_sizes;
DROP POLICY IF EXISTS "profile_sizes_delete_policy" ON public.profile_sizes;

CREATE POLICY "profile_sizes_select_policy" ON public.profile_sizes
  FOR SELECT USING (public.can_view_profile(profile_id, 'SIZES'));

CREATE POLICY "profile_sizes_insert_policy" ON public.profile_sizes
  FOR INSERT WITH CHECK (public.can_view_profile(profile_id));

CREATE POLICY "profile_sizes_update_policy" ON public.profile_sizes
  FOR UPDATE USING (public.can_view_profile(profile_id)) WITH CHECK (public.can_view_profile(profile_id));

CREATE POLICY "profile_sizes_delete_policy" ON public.profile_sizes
  FOR DELETE USING (public.can_view_profile(profile_id));

-- taste_items
DROP POLICY IF EXISTS "Users can manage their taste items" ON public.taste_items;
DROP POLICY IF EXISTS "taste_items_select_policy" ON public.taste_items;
DROP POLICY IF EXISTS "taste_items_insert_policy" ON public.taste_items;
DROP POLICY IF EXISTS "taste_items_update_policy" ON public.taste_items;
DROP POLICY IF EXISTS "taste_items_delete_policy" ON public.taste_items;

CREATE POLICY "taste_items_select_policy" ON public.taste_items
  FOR SELECT USING (public.can_view_profile(profile_id, 'INTERESTS'));

CREATE POLICY "taste_items_insert_policy" ON public.taste_items
  FOR INSERT WITH CHECK (public.can_view_profile(profile_id));

CREATE POLICY "taste_items_update_policy" ON public.taste_items
  FOR UPDATE USING (public.can_view_profile(profile_id)) WITH CHECK (public.can_view_profile(profile_id));

CREATE POLICY "taste_items_delete_policy" ON public.taste_items
  FOR DELETE USING (public.can_view_profile(profile_id));

-- current_focuses
DROP POLICY IF EXISTS "Users can manage their current focuses" ON public.current_focuses;
DROP POLICY IF EXISTS "current_focuses_select_policy" ON public.current_focuses;
DROP POLICY IF EXISTS "current_focuses_insert_policy" ON public.current_focuses;
DROP POLICY IF EXISTS "current_focuses_update_policy" ON public.current_focuses;
DROP POLICY IF EXISTS "current_focuses_delete_policy" ON public.current_focuses;

CREATE POLICY "current_focuses_select_policy" ON public.current_focuses
  FOR SELECT USING (public.can_view_profile(profile_id, 'BASIC_INFO'));

CREATE POLICY "current_focuses_insert_policy" ON public.current_focuses
  FOR INSERT WITH CHECK (public.can_view_profile(profile_id));

CREATE POLICY "current_focuses_update_policy" ON public.current_focuses
  FOR UPDATE USING (public.can_view_profile(profile_id)) WITH CHECK (public.can_view_profile(profile_id));

CREATE POLICY "current_focuses_delete_policy" ON public.current_focuses
  FOR DELETE USING (public.can_view_profile(profile_id));

-- anti_gift_preferences
DROP POLICY IF EXISTS "Users can manage anti gift preferences" ON public.anti_gift_preferences;
DROP POLICY IF EXISTS "anti_gift_preferences_select_policy" ON public.anti_gift_preferences;
DROP POLICY IF EXISTS "anti_gift_preferences_insert_policy" ON public.anti_gift_preferences;
DROP POLICY IF EXISTS "anti_gift_preferences_update_policy" ON public.anti_gift_preferences;
DROP POLICY IF EXISTS "anti_gift_preferences_delete_policy" ON public.anti_gift_preferences;

CREATE POLICY "anti_gift_preferences_select_policy" ON public.anti_gift_preferences
  FOR SELECT USING (public.can_view_profile(profile_id, 'BASIC_INFO'));

CREATE POLICY "anti_gift_preferences_insert_policy" ON public.anti_gift_preferences
  FOR INSERT WITH CHECK (public.can_view_profile(profile_id));

CREATE POLICY "anti_gift_preferences_update_policy" ON public.anti_gift_preferences
  FOR UPDATE USING (public.can_view_profile(profile_id)) WITH CHECK (public.can_view_profile(profile_id));

CREATE POLICY "anti_gift_preferences_delete_policy" ON public.anti_gift_preferences
  FOR DELETE USING (public.can_view_profile(profile_id));

-- 5. Create gift_profile_public View for Future Wishlist / Social Queries
CREATE OR REPLACE VIEW public.gift_profile_public AS
SELECT 
  gp.id AS profile_id,
  gp.user_id,
  u.first_name,
  u.avatar_url,
  gp.bio,
  gp.city,
  gp.birth_date
FROM public.gift_profiles gp
JOIN public.users u ON u.id = gp.user_id;

COMMENT ON VIEW public.gift_profile_public IS 'Public read-only view of basic user gift profiles for social feeds and wishlist owner info';
COMMENT ON FUNCTION public.can_view_profile IS 'Evaluates section-level access (BASIC_INFO, INTERESTS, SIZES, WISHLIST, MEMORIES) based on owner and CircleAccess';
COMMENT ON FUNCTION public.check_circle_access IS 'Stub function evaluating Circle membership and section privacy permissions for Sprint 2';
