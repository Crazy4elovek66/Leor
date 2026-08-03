-- Optimized single-query RPC to load full user profile
-- Replaces 5 sequential client-side queries with 1 server-side function call
-- Returns: user info, gift profile, sizes, tastes, completeness score

CREATE OR REPLACE FUNCTION public.get_full_profile(p_user_id UUID, p_profile_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'user', (
      SELECT json_build_object(
        'id', u.id,
        'telegram_id', u.telegram_id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'username', u.username,
        'avatar_url', u.avatar_url
      ) FROM users u WHERE u.id = p_user_id
    ),
    'profile', (
      SELECT json_build_object(
        'id', gp.id,
        'user_id', gp.user_id,
        'bio', gp.bio,
        'birth_date', gp.birth_date,
        'city', gp.city
      ) FROM gift_profiles gp WHERE gp.id = p_profile_id
    ),
    'sizes', COALESCE((
      SELECT json_agg(json_build_object(
        'id', ps.id,
        'category', ps.category,
        'value', ps.value,
        'visibility', ps.visibility
      )) FROM profile_sizes ps WHERE ps.profile_id = p_profile_id
    ), '[]'::json),
    'tastes', COALESCE((
      SELECT json_agg(json_build_object(
        'id', ti.id,
        'category', ti.category,
        'title', ti.title,
        'weight', ti.weight
      )) FROM taste_items ti WHERE ti.profile_id = p_profile_id
    ), '[]'::json),
    'completeness', calculate_profile_completeness(p_profile_id)
  ) INTO v_result;
  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_full_profile(UUID, UUID) TO authenticated;
