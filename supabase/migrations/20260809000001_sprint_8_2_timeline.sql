-- Migration: Sprint 8.2 Relationship Timeline Intelligence (Leor)
-- Tables: relationship_milestones
-- RPCs: get_relationship_timeline_v2, get_relationship_journal
-- Automated Milestone Generators & RLS Policies

-- 1. Create Table relationship_milestones
CREATE TABLE IF NOT EXISTS public.relationship_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL, -- e.g. 'FIRST_CONNECTION', 'FIRST_GIFT', 'FIRST_MEMORY', 'ANNIVERSARY', 'MAJOR_MILESTONE'
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  source_type TEXT NOT NULL, -- 'MEMORY', 'GIFT', 'CIRCLE'
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_rel_milestone UNIQUE (user_a, user_b, milestone_type, source_id),
  CONSTRAINT chk_canonical_milestone_user_order CHECK (user_a < user_b)
);

-- Index for milestone lookup
CREATE INDEX IF NOT EXISTS idx_rel_milestones_users ON public.relationship_milestones(user_a, user_b, event_date DESC);

-- 2. RPC: get_relationship_timeline_v2(p_profile_id UUID)
CREATE OR REPLACE FUNCTION public.get_relationship_timeline_v2(p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_curr_user UUID := auth.uid();
  v_target_user UUID;
  v_u1 UUID;
  v_u2 UUID;
  v_first_conn_date DATE;
  v_first_gift_date DATE;
  v_first_memory_date DATE;
  v_shared_events_count INT := 0;
  v_duration_days INT := 0;
  v_timeline JSONB := '[]'::jsonb;
BEGIN
  SELECT user_id INTO v_target_user FROM public.gift_profiles WHERE id = p_profile_id;
  IF v_target_user IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'Profile not found');
  END IF;

  -- Self view fallback
  IF v_curr_user IS NOT NULL AND v_curr_user = v_target_user THEN
    RETURN jsonb_build_object(
      'found', true,
      'is_self', true,
      'first_connection_date', CURRENT_DATE::text,
      'first_gift_date', NULL,
      'first_memory_date', NULL,
      'shared_events_count', 0,
      'relationship_duration_days', 0,
      'years_groups', '[]'::jsonb
    );
  END IF;

  -- Check RLS visibility using can_view_profile
  IF NOT (
    v_curr_user = v_target_user
    OR public.can_view_profile(p_profile_id, 'MEMORIES'::public.profile_section)
  ) THEN
    RETURN jsonb_build_object('found', true, 'restricted', true, 'years_groups', '[]'::jsonb);
  END IF;

  v_u1 := LEAST(v_curr_user, v_target_user);
  v_u2 := GREATEST(v_curr_user, v_target_user);

  -- First memory date
  SELECT MIN(event_date) INTO v_first_memory_date
  FROM public.memories m
  LEFT JOIN public.memory_participants mp ON mp.memory_id = m.id
  WHERE (m.owner_user_id = v_u1 AND mp.user_id = v_u2)
     OR (m.owner_user_id = v_u2 AND mp.user_id = v_u1)
     OR (m.id IN (
          SELECT mp1.memory_id FROM public.memory_participants mp1
          JOIN public.memory_participants mp2 ON mp1.memory_id = mp2.memory_id
          WHERE mp1.user_id = v_u1 AND mp2.user_id = v_u2
        ));

  -- First gift date
  SELECT MIN(gr.confirmed_at::date) INTO v_first_gift_date
  FROM public.gift_reservations gr
  JOIN public.wishes w ON w.id = gr.wish_id
  WHERE gr.status = 'CONFIRMED'::public.gift_reservation_status
    AND (
      (gr.reserved_by = v_u1 AND w.user_id = v_u2)
      OR (gr.reserved_by = v_u2 AND w.user_id = v_u1)
    );

  -- First connection date (earliest of memory, gift, or circle join)
  SELECT MIN(d) INTO v_first_conn_date FROM (
    SELECT v_first_memory_date AS d
    UNION ALL
    SELECT v_first_gift_date AS d
    UNION ALL
    SELECT MIN(joined_at::date) AS d FROM public.circle_members WHERE user_id IN (v_u1, v_u2)
  ) t WHERE d IS NOT NULL;

  IF v_first_conn_date IS NOT NULL THEN
    v_duration_days := (CURRENT_DATE - v_first_conn_date);
  END IF;

  -- Combined Timeline Items aggregated by Year and Month
  WITH raw_events AS (
    SELECT 
      m.id AS item_id,
      'MEMORY' AS kind,
      m.memory_type::text AS sub_type,
      m.title,
      m.description,
      m.cover_image_url AS image_url,
      m.event_date::text AS date,
      EXTRACT(YEAR FROM m.event_date)::int AS year_num,
      TO_CHAR(m.event_date, 'FMMonth') AS month_name,
      EXTRACT(MONTH FROM m.event_date)::int AS month_num,
      m.created_at
    FROM public.memories m
    LEFT JOIN public.memory_participants mp ON mp.memory_id = m.id
    WHERE (m.owner_user_id = v_u1 AND mp.user_id = v_u2)
       OR (m.owner_user_id = v_u2 AND mp.user_id = v_u1)
       OR (m.id IN (
            SELECT mp1.memory_id FROM public.memory_participants mp1
            JOIN public.memory_participants mp2 ON mp1.memory_id = mp2.memory_id
            WHERE mp1.user_id = v_u1 AND mp2.user_id = v_u2
          ))

    UNION ALL

    SELECT 
      gr.id AS item_id,
      'GIFT' AS kind,
      'GIFT' AS sub_type,
      'Подарок получен: ' || w.title AS title,
      w.description,
      w.image_url,
      gr.confirmed_at::date::text AS date,
      EXTRACT(YEAR FROM gr.confirmed_at)::int AS year_num,
      TO_CHAR(gr.confirmed_at, 'FMMonth') AS month_name,
      EXTRACT(MONTH FROM gr.confirmed_at)::int AS month_num,
      gr.created_at
    FROM public.gift_reservations gr
    JOIN public.wishes w ON w.id = gr.wish_id
    WHERE gr.status = 'CONFIRMED'::public.gift_reservation_status
      AND (
        (gr.reserved_by = v_u1 AND w.user_id = v_u2)
        OR (gr.reserved_by = v_u2 AND w.user_id = v_u1)
      )
  )
  SELECT COALESCE(COUNT(*), 0) INTO v_shared_events_count FROM raw_events;

  WITH raw_events_grouped AS (
    SELECT 
      m.id AS item_id,
      'MEMORY' AS kind,
      m.memory_type::text AS sub_type,
      m.title,
      m.description,
      m.cover_image_url AS image_url,
      m.event_date::text AS date,
      EXTRACT(YEAR FROM m.event_date)::int AS year_num,
      TO_CHAR(m.event_date, 'FMMonth') AS month_name,
      EXTRACT(MONTH FROM m.event_date)::int AS month_num,
      m.created_at
    FROM public.memories m
    LEFT JOIN public.memory_participants mp ON mp.memory_id = m.id
    WHERE (m.owner_user_id = v_u1 AND mp.user_id = v_u2)
       OR (m.owner_user_id = v_u2 AND mp.user_id = v_u1)
       OR (m.id IN (
            SELECT mp1.memory_id FROM public.memory_participants mp1
            JOIN public.memory_participants mp2 ON mp1.memory_id = mp2.memory_id
            WHERE mp1.user_id = v_u1 AND mp2.user_id = v_u2
          ))

    UNION ALL

    SELECT 
      gr.id AS item_id,
      'GIFT' AS kind,
      'GIFT' AS sub_type,
      'Подарок получен: ' || w.title AS title,
      w.description,
      w.image_url,
      gr.confirmed_at::date::text AS date,
      EXTRACT(YEAR FROM gr.confirmed_at)::int AS year_num,
      TO_CHAR(gr.confirmed_at, 'FMMonth') AS month_name,
      EXTRACT(MONTH FROM gr.confirmed_at)::int AS month_num,
      gr.created_at
    FROM public.gift_reservations gr
    JOIN public.wishes w ON w.id = gr.wish_id
    WHERE gr.status = 'CONFIRMED'::public.gift_reservation_status
      AND (
        (gr.reserved_by = v_u1 AND w.user_id = v_u2)
        OR (gr.reserved_by = v_u2 AND w.user_id = v_u1)
      )
  ),
  month_groups AS (
    SELECT 
      year_num,
      month_num,
      month_name,
      jsonb_agg(jsonb_build_object(
        'id', item_id,
        'kind', kind,
        'sub_type', sub_type,
        'title', title,
        'description', description,
        'image_url', image_url,
        'date', date,
        'created_at', created_at
      ) ORDER BY date DESC) AS events
    FROM raw_events_grouped
    GROUP BY year_num, month_num, month_name
  ),
  year_groups AS (
    SELECT 
      year_num,
      jsonb_agg(jsonb_build_object(
        'month_num', month_num,
        'month_name', trim(month_name),
        'events', events
      ) ORDER BY month_num DESC) AS months
    FROM month_groups
    GROUP BY year_num
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'year', year_num,
    'months', months
  ) ORDER BY year_num DESC), '[]'::jsonb)
  INTO v_timeline
  FROM year_groups;

  RETURN jsonb_build_object(
    'found', true,
    'is_self', false,
    'restricted', false,
    'first_connection_date', COALESCE(v_first_conn_date::text, CURRENT_DATE::text),
    'first_gift_date', v_first_gift_date::text,
    'first_memory_date', v_first_memory_date::text,
    'shared_events_count', v_shared_events_count,
    'relationship_duration_days', v_duration_days,
    'years_groups', v_timeline
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 3. RPC: get_relationship_journal(p_profile_id UUID)
CREATE OR REPLACE FUNCTION public.get_relationship_journal(p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_curr_user UUID := auth.uid();
  v_target_user UUID;
  v_u1 UUID;
  v_u2 UUID;
  v_journal JSONB := '[]'::jsonb;
BEGIN
  SELECT user_id INTO v_target_user FROM public.gift_profiles WHERE id = p_profile_id;
  IF v_target_user IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'Profile not found');
  END IF;

  IF NOT (
    v_curr_user = v_target_user
    OR public.can_view_profile(p_profile_id, 'MEMORIES'::public.profile_section)
  ) THEN
    RETURN jsonb_build_object('found', true, 'restricted', true, 'journal', '[]'::jsonb);
  END IF;

  v_u1 := LEAST(v_curr_user, v_target_user);
  v_u2 := GREATEST(v_curr_user, v_target_user);

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id,
    'milestone_type', milestone_type,
    'title', title,
    'description', description,
    'event_date', event_date::text,
    'source_type', source_type
  ) ORDER BY event_date DESC), '[]'::jsonb)
  INTO v_journal
  FROM public.relationship_milestones
  WHERE user_a = v_u1 AND user_b = v_u2;

  RETURN jsonb_build_object(
    'found', true,
    'journal', v_journal
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 4. Enable RLS
ALTER TABLE public.relationship_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rel_milestones_select_policy" ON public.relationship_milestones;
CREATE POLICY "rel_milestones_select_policy" ON public.relationship_milestones
  FOR SELECT USING (
    auth.uid() = user_a OR auth.uid() = user_b
    OR EXISTS (
      SELECT 1 FROM public.gift_profiles gp 
      WHERE (gp.user_id = user_a OR gp.user_id = user_b)
        AND public.can_view_profile(gp.id, 'MEMORIES'::public.profile_section)
    )
  );
