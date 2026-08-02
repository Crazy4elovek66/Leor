-- Migration: Sprint 5 Gift Discovery Engine MVP (Leor)
-- RPC Function: get_discovery_feed(p_limit INT DEFAULT 20)

CREATE OR REPLACE FUNCTION public.get_discovery_feed(p_limit INT DEFAULT 20)
RETURNS JSONB AS $$
DECLARE
  v_current_user_id UUID;
  v_result JSONB;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Ensure Taste Graph for current user is fresh
  PERFORM public.rebuild_taste_graph(v_current_user_id);

  WITH circle_peers AS (
    -- Users sharing at least one active circle with current user
    SELECT DISTINCT cm2.user_id AS peer_user_id
    FROM public.circle_members cm1
    JOIN public.circle_members cm2 ON cm1.circle_id = cm2.circle_id
    JOIN public.circles c ON c.id = cm1.circle_id
    WHERE cm1.user_id = v_current_user_id
      AND cm2.user_id <> v_current_user_id
      AND c.is_archived = false
  ),
  eligible_wishes AS (
    -- Active wishes of peers where wishlist profile section is accessible
    SELECT 
      w.id AS wish_id,
      w.user_id AS wish_owner_id,
      w.title,
      w.description,
      w.brand,
      w.image_url,
      w.link,
      w.price,
      w.currency,
      w.category,
      w.priority,
      w.status,
      w.created_at,
      u.first_name AS owner_first_name,
      u.last_name AS owner_last_name,
      u.avatar_url AS owner_avatar_url,
      gp.id AS profile_id
    FROM public.wishes w
    JOIN circle_peers cp ON cp.peer_user_id = w.user_id
    JOIN public.users u ON u.id = w.user_id
    JOIN public.gift_profiles gp ON gp.user_id = w.user_id
    WHERE w.status = 'ACTIVE'::public.wish_status
      AND public.can_view_profile(gp.id, 'WISHLIST'::public.profile_section)
  ),
  scored_wishes AS (
    SELECT 
      ew.*,
      -- Node weight matching category or brand
      COALESCE(
        (
          SELECT MAX(weight) 
          FROM public.taste_graph_nodes 
          WHERE user_id = v_current_user_id 
            AND (
              (node_type = 'CATEGORY' AND value = ew.category::text)
              OR (ew.brand IS NOT NULL AND node_type = 'BRAND' AND lower(value) = lower(ew.brand))
            )
        ),
        0.30
      ) AS node_weight,

      -- Edge strength matching category <-> brand or co-occurrences
      COALESCE(
        (
          SELECT MAX(strength)
          FROM public.taste_graph_edges e
          JOIN public.taste_graph_nodes n1 ON n1.id = e.from_node_id
          JOIN public.taste_graph_nodes n2 ON n2.id = e.to_node_id
          WHERE e.user_id = v_current_user_id
            AND (
              (n1.node_type = 'CATEGORY' AND n1.value = ew.category::text)
              OR (ew.brand IS NOT NULL AND n2.node_type = 'BRAND' AND lower(n2.value) = lower(ew.brand))
            )
        ),
        0.20
      ) AS edge_strength,

      -- Priority weight
      CASE ew.priority
        WHEN 'HIGH'::public.wish_priority THEN 1.00
        WHEN 'MEDIUM'::public.wish_priority THEN 0.60
        ELSE 0.30
      END AS priority_weight,

      -- Matched nodes
      ARRAY_REMOVE(ARRAY[
        CASE WHEN EXISTS (
          SELECT 1 FROM public.taste_graph_nodes 
          WHERE user_id = v_current_user_id AND node_type = 'CATEGORY' AND value = ew.category::text
        ) THEN ew.category::text ELSE NULL END,
        CASE WHEN ew.brand IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.taste_graph_nodes 
          WHERE user_id = v_current_user_id AND node_type = 'BRAND' AND lower(value) = lower(ew.brand)
        ) THEN ew.brand ELSE NULL END
      ], NULL) AS matched_nodes
    FROM eligible_wishes ew
  ),
  final_recommendations AS (
    SELECT 
      sw.wish_id,
      sw.wish_owner_id,
      sw.title,
      sw.description,
      sw.brand,
      sw.image_url,
      sw.link,
      sw.price,
      sw.currency,
      sw.category,
      sw.priority,
      sw.owner_first_name || COALESCE(' ' || sw.owner_last_name, '') AS owner_name,
      sw.owner_avatar_url,
      
      -- Formula: min(100, round((node_weight * 0.5 + edge_strength * 0.3 + priority_weight * 0.2) * 100))
      LEAST(100, GREATEST(10, ROUND((sw.node_weight * 0.5 + sw.edge_strength * 0.3 + sw.priority_weight * 0.2) * 100))) AS score,
      
      -- Reasons array
      ARRAY_REMOVE(ARRAY[
        CASE WHEN sw.brand IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.taste_graph_nodes 
          WHERE user_id = v_current_user_id AND node_type = 'BRAND' AND lower(value) = lower(sw.brand)
        ) THEN 'Совпадает с вашими интересами: ' || sw.brand ELSE NULL END,

        CASE WHEN EXISTS (
          SELECT 1 FROM public.taste_graph_nodes 
          WHERE user_id = v_current_user_id AND node_type = 'CATEGORY' AND value = sw.category::text
        ) THEN 'Похоже на ваши предпочтения в ' || sw.category::text ELSE NULL END,

        'Связано с вашим Taste Graph'
      ], NULL) AS reasons,

      sw.matched_nodes,
      sw.created_at
    FROM scored_wishes sw
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'wish_id', fr.wish_id,
    'owner_id', fr.wish_owner_id,
    'title', fr.title,
    'description', fr.description,
    'brand', fr.brand,
    'image_url', fr.image_url,
    'link', fr.link,
    'price', fr.price,
    'currency', fr.currency,
    'category', fr.category,
    'priority', fr.priority,
    'owner_name', fr.owner_name,
    'owner_avatar', fr.owner_avatar_url,
    'score', fr.score,
    'match_percentage', fr.score,
    'reasons', to_jsonb(fr.reasons),
    'matched_nodes', to_jsonb(fr.matched_nodes)
  ) ORDER BY fr.score DESC, fr.created_at DESC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT * FROM final_recommendations
    ORDER BY score DESC, created_at DESC
    LIMIT LEAST(p_limit, 20)
  ) fr;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
