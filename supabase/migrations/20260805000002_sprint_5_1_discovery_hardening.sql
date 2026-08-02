-- Migration: Sprint 5.1 Discovery Hardening (Leor)
-- Indexes for discovery performance
-- Upgraded get_discovery_feed RPC with Diversity, Freshness Boost, Circle Balance, and Enhanced Explainability

-- 1. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_wishes_user_status_created ON public.wishes(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_circle_members_user_circle ON public.circle_members(user_id, circle_id);

-- 2. Upgraded RPC Function: get_discovery_feed(p_limit INT DEFAULT 20)
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

  -- Rebuild Taste Graph for current user if needed
  PERFORM public.rebuild_taste_graph(v_current_user_id);

  WITH circle_peers AS (
    -- Unique peers and their shared circle count
    SELECT 
      cm2.user_id AS peer_user_id,
      COUNT(DISTINCT cm1.circle_id) AS shared_circles_count,
      MIN(c.name) AS primary_circle_name
    FROM public.circle_members cm1
    JOIN public.circle_members cm2 ON cm1.circle_id = cm2.circle_id
    JOIN public.circles c ON c.id = cm1.circle_id
    WHERE cm1.user_id = v_current_user_id
      AND cm2.user_id <> v_current_user_id
      AND c.is_archived = false
    GROUP BY cm2.user_id
  ),
  eligible_wishes AS (
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
      cp.shared_circles_count,
      cp.primary_circle_name,
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

      -- Edge strength matching
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

      -- Freshness Boost: up to +10 points if created in the last 14 days
      LEAST(10.0, ROUND(GREATEST(0, (14 - EXTRACT(EPOCH FROM (now() - ew.created_at)) / 86400.0) / 14.0 * 10.0), 2)) AS freshness_boost
    FROM eligible_wishes ew
  ),
  ranked_wishes AS (
    SELECT 
      sw.*,
      -- Base Score (0-100) + Freshness Boost (+0-10)
      LEAST(100, GREATEST(10, ROUND((sw.node_weight * 0.5 + sw.edge_strength * 0.3 + sw.priority_weight * 0.2) * 100 + sw.freshness_boost))) AS score,
      
      -- Circle Balance Window: Rank wishes per owner to prevent single owner domination
      ROW_NUMBER() OVER (PARTITION BY sw.wish_owner_id ORDER BY (sw.node_weight * 0.5 + sw.edge_strength * 0.3 + sw.priority_weight * 0.2) DESC, sw.created_at DESC) AS owner_wish_rank,
      
      -- Category Rank per user
      ROW_NUMBER() OVER (PARTITION BY sw.category ORDER BY (sw.node_weight * 0.5 + sw.edge_strength * 0.3 + sw.priority_weight * 0.2) DESC, sw.created_at DESC) AS category_wish_rank
    FROM scored_wishes sw
  ),
  balanced_feed AS (
    -- Limit per owner (max 3 wishes per owner in initial candidate pool)
    SELECT * FROM ranked_wishes
    WHERE owner_wish_rank <= 3 AND category_wish_rank <= 4
  ),
  explained_feed AS (
    SELECT 
      bf.wish_id,
      bf.wish_owner_id,
      bf.title,
      bf.description,
      bf.brand,
      bf.image_url,
      bf.link,
      bf.price,
      bf.currency,
      bf.category,
      bf.priority,
      bf.owner_first_name || COALESCE(' ' || bf.owner_last_name, '') AS owner_name,
      bf.owner_avatar_url,
      bf.score,
      bf.freshness_boost,
      bf.created_at,

      -- Deduplicated & Prioritized Reasons (Max 3)
      ARRAY_REMOVE(ARRAY[
        -- 1. Brand match
        CASE WHEN bf.brand IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.taste_graph_nodes 
          WHERE user_id = v_current_user_id AND node_type = 'BRAND' AND lower(value) = lower(bf.brand)
        ) THEN 'Совпадает с вашими интересами: ' || bf.brand ELSE NULL END,

        -- 2. Category match
        CASE WHEN EXISTS (
          SELECT 1 FROM public.taste_graph_nodes 
          WHERE user_id = v_current_user_id AND node_type = 'CATEGORY' AND value = bf.category::text
        ) THEN 'Похоже на ваши предпочтения в ' || bf.category::text ELSE NULL END,

        -- 3. Taste Graph connection
        'Связано с вашим Taste Graph',

        -- 4. Shared circle connection
        CASE WHEN bf.primary_circle_name IS NOT NULL THEN 'Участник круга ' || bf.primary_circle_name ELSE NULL END
      ], NULL) AS raw_reasons
    FROM balanced_feed bf
  ),
  final_feed AS (
    SELECT 
      ef.wish_id,
      ef.wish_owner_id,
      ef.title,
      ef.description,
      ef.brand,
      ef.image_url,
      ef.link,
      ef.price,
      ef.currency,
      ef.category,
      ef.priority,
      ef.owner_name,
      ef.owner_avatar_url,
      ef.score,
      -- Trim reasons to max 3
      (SELECT coalesce(jsonb_agg(r), '[]'::jsonb) FROM (SELECT DISTINCT unnest(ef.raw_reasons) AS r LIMIT 3) t_r) AS reasons,
      ef.created_at
    FROM explained_feed ef
    -- Stable Ordering: score DESC, freshness_boost DESC, priority DESC, created_at DESC
    ORDER BY ef.score DESC, ef.freshness_boost DESC, ef.created_at DESC
    LIMIT LEAST(p_limit, 20)
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'wish_id', ff.wish_id,
    'owner_id', ff.wish_owner_id,
    'title', ff.title,
    'description', ff.description,
    'brand', ff.brand,
    'image_url', ff.image_url,
    'link', ff.link,
    'price', ff.price,
    'currency', ff.currency,
    'category', ff.category,
    'priority', ff.priority,
    'owner_name', ff.owner_name,
    'owner_avatar', ff.owner_avatar_url,
    'score', ff.score,
    'match_percentage', ff.score,
    'reasons', ff.reasons,
    'matched_nodes', jsonb_build_array()
  )), '[]'::jsonb)
  INTO v_result
  FROM final_feed ff;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
