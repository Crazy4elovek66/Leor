-- Migration: Sprint 1.1 Hardening (Leor)
-- Enhancements: ENUMs, Check Constraints, Triggers, Unique Indexes, RLS helper, Completeness SQL function

-- 1. Create PostgreSQL ENUM Types
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility_level') THEN
    CREATE TYPE public.visibility_level AS ENUM ('PRIVATE', 'CIRCLE', 'SELECTED_CIRCLES', 'PUBLIC');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'size_category') THEN
    CREATE TYPE public.size_category AS ENUM ('CLOTHING_TOP', 'CLOTHING_BOTTOM', 'SHOES', 'RING', 'BRACELET', 'NECKLACE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taste_category') THEN
    CREATE TYPE public.taste_category AS ENUM ('MOVIES', 'BOOKS', 'GAMES', 'MUSIC', 'TRAVEL', 'STYLE', 'HOME', 'FOOD', 'SPORT', 'HOBBY', 'BRANDS');
  END IF;
END $$;

-- 2. Convert text columns to ENUMs safely
ALTER TABLE public.profile_sizes 
  ALTER COLUMN category TYPE public.size_category USING category::public.size_category,
  ALTER COLUMN visibility TYPE public.visibility_level USING visibility::public.visibility_level;

ALTER TABLE public.taste_items 
  ALTER COLUMN category TYPE public.taste_category USING category::public.taste_category;

-- 3. Add CHECK CONSTRAINTS
ALTER TABLE public.gift_profiles
  ADD CONSTRAINT chk_gift_profiles_bio_length CHECK (length(bio) <= 500),
  ADD CONSTRAINT chk_gift_profiles_city_length CHECK (length(city) <= 100);

ALTER TABLE public.profile_sizes
  ADD CONSTRAINT chk_profile_sizes_value_length CHECK (length(value) <= 100);

ALTER TABLE public.taste_items
  ADD CONSTRAINT chk_taste_items_weight_positive CHECK (weight > 0.0);

-- 4. Automatic updated_at Trigger Function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
DROP TRIGGER IF EXISTS trg_users_set_updated_at ON public.users;
CREATE TRIGGER trg_users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_gift_profiles_set_updated_at ON public.gift_profiles;
CREATE TRIGGER trg_gift_profiles_set_updated_at
  BEFORE UPDATE ON public.gift_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_taste_items_set_updated_at ON public.taste_items;
CREATE TRIGGER trg_taste_items_set_updated_at
  BEFORE UPDATE ON public.taste_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. UNIQUE INDEXES & CONSTRAINTS
ALTER TABLE public.taste_items
  DROP CONSTRAINT IF EXISTS uq_taste_items_profile_category_title;

ALTER TABLE public.taste_items
  ADD CONSTRAINT uq_taste_items_profile_category_title UNIQUE (profile_id, category, title);

ALTER TABLE public.profile_sizes
  DROP CONSTRAINT IF EXISTS uq_profile_sizes_profile_category;

ALTER TABLE public.profile_sizes
  ADD CONSTRAINT uq_profile_sizes_profile_category UNIQUE (profile_id, category);

-- 6. RLS Helper Function: can_view_profile(profile_id)
CREATE OR REPLACE FUNCTION public.can_view_profile(p_profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_owner_user_id UUID;
BEGIN
  -- Retrieve user_id of the profile owner
  SELECT user_id INTO v_owner_user_id
  FROM public.gift_profiles
  WHERE id = p_profile_id;

  -- 1. Owner can always view their own profile
  IF v_owner_user_id IS NOT NULL AND v_owner_user_id = auth.uid() THEN
    RETURN TRUE;
  END IF;

  -- 2. Future extension point for Sprint 2 (CircleAccess check)
  -- SELECT EXISTS (
  --   SELECT 1 FROM public.circle_members cm_user
  --   JOIN public.circle_members cm_target ON cm_user.circle_id = cm_target.circle_id
  --   WHERE cm_user.user_id = auth.uid() AND cm_target.user_id = v_owner_user_id
  -- );

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update RLS Policies using can_view_profile()
DROP POLICY IF EXISTS "Users can view their own gift profile" ON public.gift_profiles;
CREATE POLICY "Users can view their own gift profile" ON public.gift_profiles
  FOR SELECT USING (public.can_view_profile(id));

DROP POLICY IF EXISTS "Users can manage their profile sizes" ON public.profile_sizes;
CREATE POLICY "Users can manage their profile sizes" ON public.profile_sizes
  FOR ALL USING (public.can_view_profile(profile_id));

DROP POLICY IF EXISTS "Users can manage their taste items" ON public.taste_items;
CREATE POLICY "Users can manage their taste items" ON public.taste_items
  FOR ALL USING (public.can_view_profile(profile_id));

DROP POLICY IF EXISTS "Users can manage their current focuses" ON public.current_focuses;
CREATE POLICY "Users can manage their current focuses" ON public.current_focuses
  FOR ALL USING (public.can_view_profile(profile_id));

DROP POLICY IF EXISTS "Users can manage anti gift preferences" ON public.anti_gift_preferences;
CREATE POLICY "Users can manage anti gift preferences" ON public.anti_gift_preferences
  FOR ALL USING (public.can_view_profile(profile_id));

-- 7. SQL Function for Profile Completeness Calculation
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 8. Additional Database Optimization & Comments
CREATE INDEX IF NOT EXISTS idx_gift_profiles_user_id ON public.gift_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_profile_sizes_profile_id ON public.profile_sizes (profile_id);
CREATE INDEX IF NOT EXISTS idx_taste_items_profile_id ON public.taste_items (profile_id);
CREATE INDEX IF NOT EXISTS idx_current_focuses_profile_id ON public.current_focuses (profile_id);
CREATE INDEX IF NOT EXISTS idx_anti_gift_preferences_profile_id ON public.anti_gift_preferences (profile_id);

COMMENT ON TYPE public.visibility_level IS 'Levels of data access: PRIVATE, CIRCLE, SELECTED_CIRCLES, PUBLIC';
COMMENT ON TYPE public.size_category IS 'Size categories: CLOTHING_TOP, CLOTHING_BOTTOM, SHOES, RING, BRACELET, NECKLACE';
COMMENT ON TYPE public.taste_category IS 'Taste & Interest categories: MOVIES, BOOKS, GAMES, MUSIC, TRAVEL, STYLE, HOME, FOOD, SPORT, HOBBY, BRANDS';

COMMENT ON TABLE public.users IS 'Core user accounts linked to Telegram ID';
COMMENT ON TABLE public.gift_profiles IS 'Gift profile card of a user containing bio, birth date, and city';
COMMENT ON TABLE public.profile_sizes IS 'Clothing, shoes, and jewelry sizes of a user profile';
COMMENT ON TABLE public.taste_items IS 'Interests and tastes graph items';
COMMENT ON TABLE public.current_focuses IS 'Active life stage focuses';
COMMENT ON TABLE public.anti_gift_preferences IS 'Anti-gift preferences (what NOT to gift)';
