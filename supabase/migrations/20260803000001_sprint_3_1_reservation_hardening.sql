-- Migration: Sprint 3.1 Reservation Hardening (Leor)
-- ENUMs: gift_reservation_status
-- Tables: gift_reservations
-- Views: wish_reservation_status
-- RPC Functions: get_wish_reservation_state, reserve_wish, cancel_reservation, confirm_reservation, expire_old_reservations
-- Indexes & RLS Policies

-- 1. Create PostgreSQL ENUM
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gift_reservation_status') THEN
    CREATE TYPE public.gift_reservation_status AS ENUM ('RESERVED', 'CONFIRMED', 'CANCELLED', 'EXPIRED');
  END IF;
END $$;

-- 2. Create Table public.gift_reservations
CREATE TABLE IF NOT EXISTS public.gift_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  reserved_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status public.gift_reservation_status NOT NULL DEFAULT 'RESERVED'::public.gift_reservation_status,
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '72 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Trigger updated_at
DROP TRIGGER IF EXISTS trg_gift_reservations_set_updated_at ON public.gift_reservations;
CREATE TRIGGER trg_gift_reservations_set_updated_at
  BEFORE UPDATE ON public.gift_reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Partial Unique Index (Only 1 active reservation per wish)
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_gift_reservation 
  ON public.gift_reservations (wish_id) 
  WHERE status IN ('RESERVED'::public.gift_reservation_status, 'CONFIRMED'::public.gift_reservation_status);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_gift_reservations_wish ON public.gift_reservations(wish_id);
CREATE INDEX IF NOT EXISTS idx_gift_reservations_reserver ON public.gift_reservations(reserved_by);
CREATE INDEX IF NOT EXISTS idx_gift_reservations_status ON public.gift_reservations(status);

-- 6. SQL View: wish_reservation_status (Aggregated, DOES NOT CONTAIN reserved_by)
CREATE OR REPLACE VIEW public.wish_reservation_status WITH (security_invoker = true) AS
SELECT 
  gr.wish_id,
  true AS has_reservation,
  (gr.status = 'CONFIRMED'::public.gift_reservation_status) AS is_confirmed,
  gr.expires_at
FROM public.gift_reservations gr
WHERE gr.status IN ('RESERVED'::public.gift_reservation_status, 'CONFIRMED'::public.gift_reservation_status);

-- 7. SECURITY DEFINER Function: get_wish_reservation_state(p_wish_id UUID)
CREATE OR REPLACE FUNCTION public.get_wish_reservation_state(p_wish_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_wish_owner_id UUID;
  v_reserver_id UUID;
  v_status public.gift_reservation_status;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Get wish owner
  SELECT user_id INTO v_wish_owner_id
  FROM public.wishes
  WHERE id = p_wish_id;

  IF v_wish_owner_id IS NULL THEN
    RETURN 'FORBIDDEN';
  END IF;

  -- Wish owner ALWAYS receives 'AVAILABLE' to prevent disclosure
  IF v_wish_owner_id = auth.uid() THEN
    RETURN 'AVAILABLE';
  END IF;

  -- Find active reservation
  SELECT reserved_by, status, expires_at INTO v_reserver_id, v_status, v_expires_at
  FROM public.gift_reservations
  WHERE wish_id = p_wish_id
    AND status IN ('RESERVED'::public.gift_reservation_status, 'CONFIRMED'::public.gift_reservation_status)
  LIMIT 1;

  IF v_status IS NULL OR (v_status = 'RESERVED' AND v_expires_at < now()) THEN
    RETURN 'AVAILABLE';
  END IF;

  IF v_status = 'CONFIRMED' THEN
    RETURN 'CONFIRMED';
  END IF;

  IF v_reserver_id = auth.uid() THEN
    RETURN 'RESERVED_BY_ME';
  END IF;

  RETURN 'RESERVED';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 8. SECURITY DEFINER Atomic Function: reserve_wish(p_wish_id UUID)
CREATE OR REPLACE FUNCTION public.reserve_wish(p_wish_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_wish_owner_id UUID;
  v_profile_id UUID;
  v_existing_id UUID;
  v_new_res_id UUID;
BEGIN
  -- 1. Lock wish row
  SELECT user_id INTO v_wish_owner_id
  FROM public.wishes
  WHERE id = p_wish_id
  FOR UPDATE;

  IF v_wish_owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'state', 'FORBIDDEN', 'error', 'Wish not found');
  END IF;

  -- 2. Cannot reserve own wish
  IF v_wish_owner_id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'state', 'FORBIDDEN', 'error', 'Cannot reserve your own wish');
  END IF;

  -- 3. Check circle access
  SELECT id INTO v_profile_id
  FROM public.gift_profiles
  WHERE user_id = v_wish_owner_id;

  IF v_profile_id IS NULL OR NOT public.can_view_profile(v_profile_id, 'WISHLIST'::public.profile_section) THEN
    RETURN jsonb_build_object('success', false, 'state', 'FORBIDDEN', 'error', 'No circle access to wishlist');
  END IF;

  -- 4. Check existing active reservation
  SELECT id INTO v_existing_id
  FROM public.gift_reservations
  WHERE wish_id = p_wish_id
    AND status IN ('RESERVED'::public.gift_reservation_status, 'CONFIRMED'::public.gift_reservation_status)
    AND (status = 'CONFIRMED' OR expires_at > now())
  FOR UPDATE;

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'state', 'ALREADY_RESERVED', 'error', 'Wish is already reserved');
  END IF;

  -- 5. Insert new reservation
  INSERT INTO public.gift_reservations (
    wish_id,
    reserved_by,
    status,
    reserved_at,
    expires_at
  ) VALUES (
    p_wish_id,
    auth.uid(),
    'RESERVED'::public.gift_reservation_status,
    now(),
    now() + interval '72 hours'
  ) RETURNING id INTO v_new_res_id;

  RETURN jsonb_build_object('success', true, 'state', 'RESERVED_BY_ME', 'reservation_id', v_new_res_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. SECURITY DEFINER Function: cancel_reservation(p_wish_id UUID)
CREATE OR REPLACE FUNCTION public.cancel_reservation(p_wish_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_res_id UUID;
BEGIN
  SELECT id INTO v_res_id
  FROM public.gift_reservations
  WHERE wish_id = p_wish_id
    AND reserved_by = auth.uid()
    AND status = 'RESERVED'::public.gift_reservation_status
  FOR UPDATE;

  IF v_res_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active reservation found to cancel');
  END IF;

  UPDATE public.gift_reservations
  SET status = 'CANCELLED'::public.gift_reservation_status,
      cancelled_at = now(),
      updated_at = now()
  WHERE id = v_res_id;

  RETURN jsonb_build_object('success', true, 'state', 'AVAILABLE');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. SECURITY DEFINER Function: confirm_reservation(p_wish_id UUID)
CREATE OR REPLACE FUNCTION public.confirm_reservation(p_wish_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_res_id UUID;
BEGIN
  SELECT id INTO v_res_id
  FROM public.gift_reservations
  WHERE wish_id = p_wish_id
    AND reserved_by = auth.uid()
    AND status = 'RESERVED'::public.gift_reservation_status
  FOR UPDATE;

  IF v_res_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active reservation found to confirm');
  END IF;

  UPDATE public.gift_reservations
  SET status = 'CONFIRMED'::public.gift_reservation_status,
      confirmed_at = now(),
      updated_at = now()
  WHERE id = v_res_id;

  RETURN jsonb_build_object('success', true, 'state', 'CONFIRMED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. Function: expire_old_reservations()
CREATE OR REPLACE FUNCTION public.expire_old_reservations()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.gift_reservations
  SET status = 'EXPIRED'::public.gift_reservation_status,
      updated_at = now()
  WHERE status = 'RESERVED'::public.gift_reservation_status
    AND expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 12. Enable RLS and Policies for gift_reservations
ALTER TABLE public.gift_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gift_reservations_select_policy" ON public.gift_reservations;
CREATE POLICY "gift_reservations_select_policy" ON public.gift_reservations
  FOR SELECT USING (
    -- Recipient NEVER gets access
    NOT EXISTS (
      SELECT 1 FROM public.wishes w
      WHERE w.id = gift_reservations.wish_id AND w.user_id = auth.uid()
    )
    AND
    -- Reserver gets full access; other circle members get access via view/rpc
    (
      reserved_by = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM public.wishes w
        JOIN public.gift_profiles gp ON gp.user_id = w.user_id
        WHERE w.id = gift_reservations.wish_id
          AND public.can_view_profile(gp.id, 'WISHLIST'::public.profile_section)
      )
    )
  );

DROP POLICY IF EXISTS "gift_reservations_insert_policy" ON public.gift_reservations;
CREATE POLICY "gift_reservations_insert_policy" ON public.gift_reservations
  FOR INSERT WITH CHECK (reserved_by = auth.uid());

DROP POLICY IF EXISTS "gift_reservations_update_policy" ON public.gift_reservations;
CREATE POLICY "gift_reservations_update_policy" ON public.gift_reservations
  FOR UPDATE USING (reserved_by = auth.uid()) WITH CHECK (reserved_by = auth.uid());

-- 13. Add to Supabase Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_reservations;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
