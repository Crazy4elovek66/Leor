-- Migration: Sprint 6 Final Hardening (Leor)
-- 1. Enforce share visibility validation (at least one section must remain true)
-- 2. Mark get_public_profile as STABLE for PostgreSQL caching
-- 3. Hardened rotate_public_share_token with updated_at timestamp

-- 1. Enforce Share Visibility Validation
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

  -- Validation: At least one section must remain visible
  IF NOT (p_basic OR p_interests OR p_wishlist OR p_sizes) THEN
    RAISE EXCEPTION 'At least one profile section must remain publicly visible';
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

-- 2. Hardened Token Rotation Audit
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

-- 3. Mark get_public_profile as STABLE for Caching Optimization
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

  -- Constant-time indexed lookup
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
      'bio', COALESCE(v_profile.bio, 'Список желаний и увлечений в Leor Secret Circle.'),
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
