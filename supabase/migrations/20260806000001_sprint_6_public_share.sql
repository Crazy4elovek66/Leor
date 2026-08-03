-- Migration: Sprint 6 Public Profiles & Share Layer (Leor)
-- Table: public_profile_shares
-- Functions: generate_share_token, create_public_share, rotate_public_share_token, disable_public_share, update_public_share_visibility, get_public_profile

-- 1. Create Table public_profile_shares
CREATE TABLE IF NOT EXISTS public.public_profile_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.gift_profiles(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE CONSTRAINT chk_share_token_len CHECK (length(share_token) >= 24),
  is_active BOOLEAN NOT NULL DEFAULT true,
  show_basic_info BOOLEAN NOT NULL DEFAULT true,
  show_interests BOOLEAN NOT NULL DEFAULT true,
  show_wishlist BOOLEAN NOT NULL DEFAULT true,
  show_sizes BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_public_shares_set_updated_at ON public.public_profile_shares;
CREATE TRIGGER trg_public_shares_set_updated_at
  BEFORE UPDATE ON public.public_profile_shares
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_public_shares_token ON public.public_profile_shares(share_token) WHERE is_active = true;

-- 2. Helper Function: generate_share_token()
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS TEXT AS $$
DECLARE
  v_chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  v_result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..28 LOOP
    v_result := v_result || substr(v_chars, floor(random() * 62 + 1)::int, 1);
  END LOOP;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. RPC: create_public_share(p_profile_id UUID)
CREATE OR REPLACE FUNCTION public.create_public_share(p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_token TEXT;
  v_share RECORD;
BEGIN
  -- Verify ownership
  SELECT user_id INTO v_user_id FROM public.gift_profiles WHERE id = p_profile_id;

  IF v_user_id IS NULL OR v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT * INTO v_share FROM public.public_profile_shares WHERE profile_id = p_profile_id;

  IF v_share IS NULL THEN
    v_token := public.generate_share_token();
    INSERT INTO public.public_profile_shares (profile_id, share_token, is_active)
    VALUES (p_profile_id, v_token, true)
    RETURNING * INTO v_share;
  ELSIF NOT v_share.is_active THEN
    UPDATE public.public_profile_shares
    SET is_active = true, updated_at = now()
    WHERE profile_id = p_profile_id
    RETURNING * INTO v_share;
  END IF;

  RETURN jsonb_build_object(
    'id', v_share.id,
    'profile_id', v_share.profile_id,
    'share_token', v_share.share_token,
    'is_active', v_share.is_active,
    'show_basic_info', v_share.show_basic_info,
    'show_interests', v_share.show_interests,
    'show_wishlist', v_share.show_wishlist,
    'show_sizes', v_share.show_sizes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. RPC: rotate_public_share_token(p_profile_id UUID)
CREATE OR REPLACE FUNCTION public.rotate_public_share_token(p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_new_token TEXT;
  v_share RECORD;
BEGIN
  SELECT user_id INTO v_user_id FROM public.gift_profiles WHERE id = p_profile_id;

  IF v_user_id IS NULL OR v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  v_new_token := public.generate_share_token();

  UPDATE public.public_profile_shares
  SET share_token = v_new_token, is_active = true, updated_at = now()
  WHERE profile_id = p_profile_id
  RETURNING * INTO v_share;

  IF v_share IS NULL THEN
    RAISE EXCEPTION 'Public share does not exist';
  END IF;

  RETURN jsonb_build_object(
    'id', v_share.id,
    'profile_id', v_share.profile_id,
    'share_token', v_share.share_token,
    'is_active', v_share.is_active,
    'show_basic_info', v_share.show_basic_info,
    'show_interests', v_share.show_interests,
    'show_wishlist', v_share.show_wishlist,
    'show_sizes', v_share.show_sizes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. RPC: disable_public_share(p_profile_id UUID)
CREATE OR REPLACE FUNCTION public.disable_public_share(p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM public.gift_profiles WHERE id = p_profile_id;

  IF v_user_id IS NULL OR v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.public_profile_shares
  SET is_active = false, updated_at = now()
  WHERE profile_id = p_profile_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. RPC: update_public_share_visibility
CREATE OR REPLACE FUNCTION public.update_public_share_visibility(
  p_profile_id UUID,
  p_basic BOOLEAN,
  p_interests BOOLEAN,
  p_wishlist BOOLEAN,
  p_sizes BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_share RECORD;
BEGIN
  SELECT user_id INTO v_user_id FROM public.gift_profiles WHERE id = p_profile_id;

  IF v_user_id IS NULL OR v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.public_profile_shares
  SET 
    show_basic_info = p_basic,
    show_interests = p_interests,
    show_wishlist = p_wishlist,
    show_sizes = p_sizes,
    updated_at = now()
  WHERE profile_id = p_profile_id
  RETURNING * INTO v_share;

  RETURN jsonb_build_object(
    'id', v_share.id,
    'profile_id', v_share.profile_id,
    'share_token', v_share.share_token,
    'is_active', v_share.is_active,
    'show_basic_info', v_share.show_basic_info,
    'show_interests', v_share.show_interests,
    'show_wishlist', v_share.show_wishlist,
    'show_sizes', v_share.show_sizes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. RPC Unauthenticated: get_public_profile(p_token TEXT)
CREATE OR REPLACE FUNCTION public.get_public_profile(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_share RECORD;
  v_profile RECORD;
  v_user RECORD;
  v_interests JSONB := '[]'::jsonb;
  v_wishes JSONB := '[]'::jsonb;
  v_sizes JSONB := '[]'::jsonb;
BEGIN
  IF p_token IS NULL OR length(p_token) < 24 THEN
    RETURN jsonb_build_object('found', false, 'error', 'Invalid token');
  END IF;

  -- Fetch share record
  SELECT * INTO v_share 
  FROM public.public_profile_shares 
  WHERE share_token = p_token AND is_active = true;

  IF v_share IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'Share link inactive or not found');
  END IF;

  -- Fetch profile and user
  SELECT * INTO v_profile FROM public.gift_profiles WHERE id = v_share.profile_id;
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'Profile not found');
  END IF;

  SELECT first_name, last_name, avatar_url INTO v_user FROM public.users WHERE id = v_profile.user_id;

  -- Fetch interests if allowed
  IF v_share.show_interests THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'category', category,
      'title', title,
      'weight', weight
    )), '[]'::jsonb) INTO v_interests
    FROM public.taste_items
    WHERE profile_id = v_profile.id;
  END IF;

  -- Fetch active wishes if allowed
  IF v_share.show_wishlist THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'title', title,
      'description', description,
      'brand', brand,
      'image_url', image_url,
      'link', link,
      'price', price,
      'currency', currency,
      'category', category,
      'priority', priority
    )), '[]'::jsonb) INTO v_wishes
    FROM public.wishes
    WHERE user_id = v_profile.user_id AND status = 'ACTIVE'::public.wish_status;
  END IF;

  -- Fetch sizes if allowed
  IF v_share.show_sizes THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'category', category,
      'value', value
    )), '[]'::jsonb) INTO v_sizes
    FROM public.profile_sizes
    WHERE profile_id = v_profile.id;
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'owner', jsonb_build_object(
      'first_name', v_user.first_name,
      'last_name', v_user.last_name,
      'avatar_url', v_user.avatar_url
    ),
    'basic_info', CASE WHEN v_share.show_basic_info THEN jsonb_build_object(
      'bio', v_profile.bio,
      'city', v_profile.city,
      'birth_date', v_profile.birth_date
    ) ELSE NULL END,
    'show_interests', v_share.show_interests,
    'show_wishlist', v_share.show_wishlist,
    'show_sizes', v_share.show_sizes,
    'interests', v_interests,
    'wishes', v_wishes,
    'sizes', v_sizes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. RLS Policies
ALTER TABLE public.public_profile_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_shares_select_policy" ON public.public_profile_shares;
CREATE POLICY "public_shares_select_policy" ON public.public_profile_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gift_profiles gp 
      WHERE gp.id = public_profile_shares.profile_id AND gp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "public_shares_insert_policy" ON public.public_profile_shares;
CREATE POLICY "public_shares_insert_policy" ON public.public_profile_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gift_profiles gp 
      WHERE gp.id = public_profile_shares.profile_id AND gp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "public_shares_update_policy" ON public.public_profile_shares;
CREATE POLICY "public_shares_update_policy" ON public.public_profile_shares
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.gift_profiles gp 
      WHERE gp.id = public_profile_shares.profile_id AND gp.user_id = auth.uid()
    )
  );
