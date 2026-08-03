-- Migration: Sprint 8.3 Lifecycle Events & Milestone Automation (Leor)
-- Tables: lifecycle_notifications, relationship_anniversaries, relationship_activity_metrics
-- RPCs: calculate_relationship_anniversary, rebuild_relationship_lifecycle, get_upcoming_relationship_events, get_relationship_activity, detect_relationship_inactivity
-- Triggers and RLS Policies

-- 1. Create Table lifecycle_notifications
CREATE TABLE IF NOT EXISTS public.lifecycle_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'ANNIVERSARY', 'BIRTHDAY', 'INACTIVITY_NUDGE', 'MILESTONE'
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create Table relationship_anniversaries
CREATE TABLE IF NOT EXISTS public.relationship_anniversaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  anniversary_type TEXT NOT NULL, -- 'FRIENDSHIP_ANNIVERSARY', 'FIRST_GIFT_ANNIVERSARY', 'MEMORIES_ANNIVERSARY'
  title TEXT NOT NULL,
  anniversary_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_rel_anniversary UNIQUE (user_a, user_b, anniversary_type),
  CONSTRAINT chk_canonical_anniversary_user_order CHECK (user_a < user_b)
);

-- 3. Create Table relationship_activity_metrics
CREATE TABLE IF NOT EXISTS public.relationship_activity_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_interaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inactivity_days INT NOT NULL DEFAULT 0,
  health_status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'NEEDS_NUDGE', 'INACTIVE'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_rel_activity UNIQUE (user_a, user_b),
  CONSTRAINT chk_canonical_activity_user_order CHECK (user_a < user_b)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lifecycle_notif_user ON public.lifecycle_notifications(user_id, is_read, due_date ASC);
CREATE INDEX IF NOT EXISTS idx_rel_anniversaries_users ON public.relationship_anniversaries(user_a, user_b);
CREATE INDEX IF NOT EXISTS idx_rel_activity_users ON public.relationship_activity_metrics(user_a, user_b);

-- 4. RPC: calculate_relationship_anniversary(p_user_a UUID, p_user_b UUID)
CREATE OR REPLACE FUNCTION public.calculate_relationship_anniversary(p_user_a UUID, p_user_b UUID)
RETURNS JSONB AS $$
DECLARE
  v_u1 UUID;
  v_u2 UUID;
  v_first_date DATE;
  v_next_anniv DATE;
  v_years INT;
BEGIN
  IF p_user_a IS NULL OR p_user_b IS NULL OR p_user_a = p_user_b THEN
    RETURN jsonb_build_object('error', 'Invalid users');
  END IF;

  v_u1 := LEAST(p_user_a, p_user_b);
  v_u2 := GREATEST(p_user_a, p_user_b);

  -- Determine earliest joint date
  SELECT MIN(d) INTO v_first_date FROM (
    SELECT event_date AS d FROM public.memories WHERE (owner_user_id = v_u1 OR owner_user_id = v_u2)
    UNION ALL
    SELECT joined_at::date AS d FROM public.circle_members WHERE user_id IN (v_u1, v_u2)
  ) t WHERE d IS NOT NULL;

  IF v_first_date IS NULL THEN
    RETURN jsonb_build_object('anniversary_found', false);
  END IF;

  v_years := EXTRACT(YEAR FROM CURRENT_DATE)::int - EXTRACT(YEAR FROM v_first_date)::int;
  v_next_anniv := (v_first_date + (v_years || ' years')::interval)::date;

  IF v_next_anniv < CURRENT_DATE THEN
    v_next_anniv := (v_first_date + ((v_years + 1) || ' years')::interval)::date;
  END IF;

  INSERT INTO public.relationship_anniversaries (
    user_a, user_b, anniversary_type, title, anniversary_date
  ) VALUES (
    v_u1, v_u2, 'FRIENDSHIP_ANNIVERSARY', 'Годовщина дружбы (' || GREATEST(1, v_years) || ' лет)', v_next_anniv
  )
  ON CONFLICT (user_a, user_b, anniversary_type) DO UPDATE SET
    title = EXCLUDED.title,
    anniversary_date = EXCLUDED.anniversary_date;

  RETURN jsonb_build_object(
    'anniversary_found', true,
    'next_anniversary_date', v_next_anniv::text,
    'years', v_years
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. RPC: get_relationship_activity(p_profile_id UUID)
CREATE OR REPLACE FUNCTION public.get_relationship_activity(p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_curr_user UUID := auth.uid();
  v_target_user UUID;
  v_u1 UUID;
  v_u2 UUID;
  v_act RECORD;
  v_last_date DATE;
  v_inactivity INT := 0;
  v_status TEXT := 'ACTIVE';
BEGIN
  SELECT user_id INTO v_target_user FROM public.gift_profiles WHERE id = p_profile_id;
  IF v_target_user IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'Profile not found');
  END IF;

  IF v_curr_user IS NOT NULL AND v_curr_user = v_target_user THEN
    RETURN jsonb_build_object('found', true, 'is_self', true, 'health_status', 'ACTIVE', 'inactivity_days', 0);
  END IF;

  v_u1 := LEAST(v_curr_user, v_target_user);
  v_u2 := GREATEST(v_curr_user, v_target_user);

  -- Determine last interaction date
  SELECT MAX(d) INTO v_last_date FROM (
    SELECT event_date AS d FROM public.memories WHERE (owner_user_id = v_u1 OR owner_user_id = v_u2)
    UNION ALL
    SELECT created_at::date AS d FROM public.gift_reservations WHERE reserved_by IN (v_u1, v_u2)
  ) t;

  IF v_last_date IS NOT NULL THEN
    v_inactivity := (CURRENT_DATE - v_last_date);
  ELSE
    v_last_date := CURRENT_DATE;
    v_inactivity := 0;
  END IF;

  IF v_inactivity > 90 THEN
    v_status := 'INACTIVE';
  ELSIF v_inactivity > 45 THEN
    v_status := 'NEEDS_NUDGE';
  ELSE
    v_status := 'ACTIVE';
  END IF;

  INSERT INTO public.relationship_activity_metrics (
    user_a, user_b, last_interaction_date, inactivity_days, health_status, updated_at
  ) VALUES (
    v_u1, v_u2, v_last_date, v_inactivity, v_status, now()
  )
  ON CONFLICT (user_a, user_b) DO UPDATE SET
    last_interaction_date = EXCLUDED.last_interaction_date,
    inactivity_days = EXCLUDED.inactivity_days,
    health_status = EXCLUDED.health_status,
    updated_at = now()
  RETURNING * INTO v_act;

  RETURN jsonb_build_object(
    'found', true,
    'is_self', false,
    'last_interaction_date', v_last_date::text,
    'inactivity_days', v_inactivity,
    'health_status', v_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. RPC: get_upcoming_relationship_events(p_profile_id UUID)
CREATE OR REPLACE FUNCTION public.get_upcoming_relationship_events(p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_curr_user UUID := auth.uid();
  v_target_user UUID;
  v_events JSONB := '[]'::jsonb;
  v_bday DATE;
  v_bday_formatted DATE;
BEGIN
  SELECT user_id INTO v_target_user FROM public.gift_profiles WHERE id = p_profile_id;
  IF v_target_user IS NULL THEN
    RETURN jsonb_build_object('found', false, 'events', '[]'::jsonb);
  END IF;

  -- Fetch profile birthday
  SELECT birth_date::date INTO v_bday FROM public.gift_profiles WHERE id = p_profile_id;

  WITH upcoming_items AS (
    -- Birthdays
    SELECT 
      'BIRTHDAY' AS event_type,
      'День рождения' AS title,
      'Приближается день рождения друга' AS description,
      (v_bday + ((EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM v_bday)) || ' years')::interval)::date AS due_date
    WHERE v_bday IS NOT NULL

    UNION ALL

    -- Anniversaries
    SELECT 
      anniversary_type AS event_type,
      title,
      'Памятная дата отношений' AS description,
      anniversary_date AS due_date
    FROM public.relationship_anniversaries
    WHERE (user_a = v_curr_user AND user_b = v_target_user)
       OR (user_a = v_target_user AND user_b = v_curr_user)
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'event_type', event_type,
    'title', title,
    'description', description,
    'due_date', due_date::text
  ) ORDER BY due_date ASC), '[]'::jsonb)
  INTO v_events
  FROM upcoming_items
  WHERE due_date >= CURRENT_DATE AND due_date <= (CURRENT_DATE + interval '60 days');

  RETURN jsonb_build_object(
    'found', true,
    'events', v_events
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 7. RPC: detect_relationship_inactivity(p_user_id UUID)
CREATE OR REPLACE FUNCTION public.detect_relationship_inactivity(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  r RECORD;
  v_count INT := 0;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;

  FOR r IN
    SELECT user_b AS peer_id FROM public.relationship_activity_metrics 
    WHERE user_a = p_user_id AND inactivity_days > 45
    UNION
    SELECT user_a AS peer_id FROM public.relationship_activity_metrics 
    WHERE user_b = p_user_id AND inactivity_days > 45
  LOOP
    INSERT INTO public.lifecycle_notifications (
      user_id, target_user_id, event_type, title, description, due_date
    ) VALUES (
      p_user_id, r.peer_id, 'INACTIVITY_NUDGE', 'Давно не общались', 'Вы давно не обменивались подарками или воспоминаниями', CURRENT_DATE
    )
    ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Enable RLS
ALTER TABLE public.lifecycle_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_anniversaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_activity_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lifecycle_notifications_policy" ON public.lifecycle_notifications;
CREATE POLICY "lifecycle_notifications_policy" ON public.lifecycle_notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "relationship_anniversaries_policy" ON public.relationship_anniversaries;
CREATE POLICY "relationship_anniversaries_policy" ON public.relationship_anniversaries
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "relationship_activity_metrics_policy" ON public.relationship_activity_metrics;
CREATE POLICY "relationship_activity_metrics_policy" ON public.relationship_activity_metrics
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);
