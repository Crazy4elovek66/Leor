-- Migration: Sprint 8.1 Relationship Intelligence Engine (Leor)
-- Tables: relationship_scores, relationship_events
-- RPCs: calculate_relationship_strength, rebuild_relationship_scores, get_relationship_summary
-- Triggers & Indexes for Relationship Analytics

-- 1. Create Table relationship_scores
CREATE TABLE IF NOT EXISTS public.relationship_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  strength_score INT NOT NULL DEFAULT 0 CONSTRAINT chk_rel_strength CHECK (strength_score BETWEEN 0 AND 100),
  gift_affinity INT NOT NULL DEFAULT 0 CONSTRAINT chk_rel_gift CHECK (gift_affinity BETWEEN 0 AND 100),
  memory_affinity INT NOT NULL DEFAULT 0 CONSTRAINT chk_rel_memory CHECK (memory_affinity BETWEEN 0 AND 100),
  taste_similarity INT NOT NULL DEFAULT 0 CONSTRAINT chk_rel_taste CHECK (taste_similarity BETWEEN 0 AND 100),
  interaction_score INT NOT NULL DEFAULT 0 CONSTRAINT chk_rel_interaction CHECK (interaction_score BETWEEN 0 AND 100),
  last_recalculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_relationship_pair UNIQUE (user_a, user_b),
  CONSTRAINT chk_canonical_user_order CHECK (user_a < user_b)
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_rel_scores_updated_at ON public.relationship_scores;
CREATE TRIGGER trg_rel_scores_updated_at
  BEFORE UPDATE ON public.relationship_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Create Table relationship_events
CREATE TABLE IF NOT EXISTS public.relationship_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES public.relationship_scores(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_id UUID,
  score_delta INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_rel_scores_user_a ON public.relationship_scores(user_a);
CREATE INDEX IF NOT EXISTS idx_rel_scores_user_b ON public.relationship_scores(user_b);
CREATE INDEX IF NOT EXISTS idx_rel_events_relationship ON public.relationship_events(relationship_id, created_at DESC);

-- 4. RPC: calculate_relationship_strength(p_user_a UUID, p_user_b UUID)
CREATE OR REPLACE FUNCTION public.calculate_relationship_strength(p_user_a UUID, p_user_b UUID)
RETURNS JSONB AS $$
DECLARE
  v_u1 UUID;
  v_u2 UUID;
  v_shared_circles INT := 0;
  v_gifts_exchanged INT := 0;
  v_joint_memories INT := 0;
  v_taste_sim INT := 0;
  v_interaction INT := 0;
  v_gift_aff INT := 0;
  v_mem_aff INT := 0;
  v_final_strength INT := 0;
  v_rel_id UUID;
BEGIN
  IF p_user_a IS NULL OR p_user_b IS NULL OR p_user_a = p_user_b THEN
    RETURN jsonb_build_object('error', 'Invalid users');
  END IF;

  v_u1 := LEAST(p_user_a, p_user_b);
  v_u2 := GREATEST(p_user_a, p_user_b);

  -- 1. Shared circles count
  SELECT COUNT(*) INTO v_shared_circles
  FROM public.circle_members cm1
  JOIN public.circle_members cm2 ON cm1.circle_id = cm2.circle_id
  WHERE cm1.user_id = v_u1 AND cm2.user_id = v_u2;

  -- 2. Gifts exchanged count (confirmed reservations between u1 & u2)
  SELECT COUNT(*) INTO v_gifts_exchanged
  FROM public.gift_reservations gr
  JOIN public.wishes w ON w.id = gr.wish_id
  WHERE gr.status = 'CONFIRMED'::public.gift_reservation_status
    AND (
      (gr.reserved_by = v_u1 AND w.user_id = v_u2)
      OR (gr.reserved_by = v_u2 AND w.user_id = v_u1)
    );

  -- 3. Joint memories count
  SELECT COUNT(DISTINCT m.id) INTO v_joint_memories
  FROM public.memories m
  LEFT JOIN public.memory_participants mp ON mp.memory_id = m.id
  WHERE (m.owner_user_id = v_u1 AND mp.user_id = v_u2)
     OR (m.owner_user_id = v_u2 AND mp.user_id = v_u1)
     OR (m.id IN (
          SELECT mp1.memory_id FROM public.memory_participants mp1
          JOIN public.memory_participants mp2 ON mp1.memory_id = mp2.memory_id
          WHERE mp1.user_id = v_u1 AND mp2.user_id = v_u2
        ));

  -- 4. Taste Graph Similarity (Matching values across taste_graph_nodes)
  WITH u1_nodes AS (
    SELECT node_type, lower(trim(value)) AS val, weight
    FROM public.taste_graph_nodes WHERE user_id = v_u1
  ),
  u2_nodes AS (
    SELECT node_type, lower(trim(value)) AS val, weight
    FROM public.taste_graph_nodes WHERE user_id = v_u2
  ),
  matches AS (
    SELECT u1.weight AS w1, u2.weight AS w2
    FROM u1_nodes u1
    JOIN u2_nodes u2 ON u1.node_type = u2.node_type AND u1.val = u2.val
  )
  SELECT COALESCE(LEAST(100, ROUND(SUM(w1 * w2) * 20)), 0) INTO v_taste_sim
  FROM matches;

  -- Component Scoring Formulas
  v_interaction := LEAST(100, v_shared_circles * 30);
  v_gift_aff := LEAST(100, v_gifts_exchanged * 40 + ROUND(v_taste_sim * 0.3));
  v_mem_aff := LEAST(100, v_joint_memories * 35);

  -- Final Weighted Strength (0–100)
  v_final_strength := LEAST(100, ROUND(v_interaction * 0.25 + v_gift_aff * 0.40 + v_mem_aff * 0.35));

  -- Upsert into relationship_scores
  INSERT INTO public.relationship_scores (
    user_a, user_b, strength_score, gift_affinity, memory_affinity, taste_similarity, interaction_score, last_recalculated_at
  ) VALUES (
    v_u1, v_u2, v_final_strength, v_gift_aff, v_mem_aff, v_taste_sim, v_interaction, now()
  )
  ON CONFLICT (user_a, user_b) DO UPDATE SET
    strength_score = EXCLUDED.strength_score,
    gift_affinity = EXCLUDED.gift_affinity,
    memory_affinity = EXCLUDED.memory_affinity,
    taste_similarity = EXCLUDED.taste_similarity,
    interaction_score = EXCLUDED.interaction_score,
    last_recalculated_at = now()
  RETURNING id INTO v_rel_id;

  RETURN jsonb_build_object(
    'relationship_id', v_rel_id,
    'user_a', v_u1,
    'user_b', v_u2,
    'strength_score', v_final_strength,
    'gift_affinity', v_gift_aff,
    'memory_affinity', v_mem_aff,
    'taste_similarity', v_taste_sim,
    'interaction_score', v_interaction,
    'shared_circles', v_shared_circles,
    'gifts_exchanged', v_gifts_exchanged,
    'joint_memories', v_joint_memories
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. RPC: rebuild_relationship_scores(p_user_id UUID)
CREATE OR REPLACE FUNCTION public.rebuild_relationship_scores(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  r RECORD;
  v_count INT := 0;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;

  FOR r IN
    SELECT DISTINCT peer_id FROM (
      SELECT user_id AS peer_id FROM public.circle_members WHERE circle_id IN (
        SELECT circle_id FROM public.circle_members WHERE user_id = p_user_id
      ) AND user_id <> p_user_id
      UNION
      SELECT owner_user_id AS peer_id FROM public.memories WHERE id IN (
        SELECT memory_id FROM public.memory_participants WHERE user_id = p_user_id
      ) AND owner_user_id <> p_user_id
      UNION
      SELECT user_id AS peer_id FROM public.memory_participants WHERE memory_id IN (
        SELECT id FROM public.memories WHERE owner_user_id = p_user_id
      ) AND user_id <> p_user_id
    ) peers
  LOOP
    PERFORM public.calculate_relationship_strength(p_user_id, r.peer_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. RPC: get_relationship_summary(p_profile_id UUID)
CREATE OR REPLACE FUNCTION public.get_relationship_summary(p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_curr_user UUID := auth.uid();
  v_target_user UUID;
  v_rel RECORD;
  v_u1 UUID;
  v_u2 UUID;
  v_shared_memories INT := 0;
  v_gifts_exchanged INT := 0;
  v_earliest_date DATE;
  v_years_known NUMERIC := 0.0;
  v_timeline JSONB := '[]'::jsonb;
BEGIN
  SELECT user_id INTO v_target_user FROM public.gift_profiles WHERE id = p_profile_id;
  IF v_target_user IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'Profile not found');
  END IF;

  -- Same user check
  IF v_curr_user IS NOT NULL AND v_curr_user = v_target_user THEN
    RETURN jsonb_build_object(
      'found', true,
      'is_self', true,
      'strength', 100,
      'shared_memories', 0,
      'gifts_exchanged', 0,
      'taste_similarity', 100,
      'years_known', 0,
      'timeline_highlights', '[]'::jsonb
    );
  END IF;

  v_u1 := LEAST(v_curr_user, v_target_user);
  v_u2 := GREATEST(v_curr_user, v_target_user);

  -- Retrieve relationship score
  SELECT * INTO v_rel FROM public.relationship_scores WHERE user_a = v_u1 AND user_b = v_u2;

  -- If missing, dynamically compute
  IF v_rel IS NULL AND v_curr_user IS NOT NULL THEN
    PERFORM public.calculate_relationship_strength(v_curr_user, v_target_user);
    SELECT * INTO v_rel FROM public.relationship_scores WHERE user_a = v_u1 AND user_b = v_u2;
  END IF;

  -- Count shared memories
  SELECT COUNT(DISTINCT m.id) INTO v_shared_memories
  FROM public.memories m
  LEFT JOIN public.memory_participants mp ON mp.memory_id = m.id
  WHERE (m.owner_user_id = v_curr_user AND mp.user_id = v_target_user)
     OR (m.owner_user_id = v_target_user AND mp.user_id = v_curr_user)
     OR (m.id IN (
          SELECT mp1.memory_id FROM public.memory_participants mp1
          JOIN public.memory_participants mp2 ON mp1.memory_id = mp2.memory_id
          WHERE mp1.user_id = v_curr_user AND mp2.user_id = v_target_user
        ));

  -- Count gifts exchanged
  SELECT COUNT(*) INTO v_gifts_exchanged
  FROM public.gift_reservations gr
  JOIN public.wishes w ON w.id = gr.wish_id
  WHERE gr.status = 'CONFIRMED'::public.gift_reservation_status
    AND (
      (gr.reserved_by = v_curr_user AND w.user_id = v_target_user)
      OR (gr.reserved_by = v_target_user AND w.user_id = v_curr_user)
    );

  -- Earliest connection date
  SELECT MIN(d) INTO v_earliest_date FROM (
    SELECT event_date AS d FROM public.memories WHERE (owner_user_id = v_curr_user OR owner_user_id = v_target_user)
    UNION
    SELECT created_at::date AS d FROM public.circle_members WHERE user_id IN (v_curr_user, v_target_user)
  ) dates;

  IF v_earliest_date IS NOT NULL THEN
    v_years_known := ROUND((CURRENT_DATE - v_earliest_date)::numeric / 365.25, 1);
  END IF;

  -- Timeline highlights (recent 3 joint events)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'title', title,
    'date', event_date::text,
    'type', memory_type::text
  )), '[]'::jsonb) INTO v_timeline
  FROM (
    SELECT title, event_date, memory_type
    FROM public.memories
    WHERE (owner_user_id = v_curr_user OR owner_user_id = v_target_user)
    ORDER BY event_date DESC
    LIMIT 3
  ) h;

  RETURN jsonb_build_object(
    'found', true,
    'is_self', false,
    'strength', COALESCE(v_rel.strength_score, 0),
    'gift_affinity', COALESCE(v_rel.gift_affinity, 0),
    'memory_affinity', COALESCE(v_rel.memory_affinity, 0),
    'taste_similarity', COALESCE(v_rel.taste_similarity, 0),
    'shared_memories', v_shared_memories,
    'gifts_exchanged', v_gifts_exchanged,
    'years_known', v_years_known,
    'timeline_highlights', v_timeline
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 7. Triggers for Automatic Score Recalculation
CREATE OR REPLACE FUNCTION public.trg_recalculate_rel_on_memory()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.rebuild_relationship_scores(NEW.owner_user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_memories_rel_score ON public.memories;
CREATE TRIGGER trg_memories_rel_score
  AFTER INSERT OR UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_rel_on_memory();

-- 8. Enable RLS
ALTER TABLE public.relationship_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rel_scores_select_policy" ON public.relationship_scores;
CREATE POLICY "rel_scores_select_policy" ON public.relationship_scores
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "rel_events_select_policy" ON public.relationship_events;
CREATE POLICY "rel_events_select_policy" ON public.relationship_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.relationship_scores rs
      WHERE rs.id = relationship_events.relationship_id AND (auth.uid() = rs.user_a OR auth.uid() = rs.user_b)
    )
  );
