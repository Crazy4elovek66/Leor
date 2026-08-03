-- Migration: Sprint 7 Memories & Relationship Timeline (Leor)
-- ENUMs: memory_type
-- Tables: memories, memory_participants, memory_media
-- RPC: get_relationship_timeline(p_profile_id UUID)
-- RLS Policies & Supabase Storage Bucket setup

-- 1. Create PostgreSQL ENUM memory_type
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'memory_type') THEN
    CREATE TYPE public.memory_type AS ENUM (
      'GIFT', 'EVENT', 'PHOTO', 'TRAVEL', 'CELEBRATION', 'ACHIEVEMENT', 'MILESTONE', 'OTHER'
    );
  END IF;
END $$;

-- 2. Create Table memories
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES public.circles(id) ON DELETE SET NULL,
  wish_id UUID REFERENCES public.wishes(id) ON DELETE SET NULL,
  gift_reservation_id UUID REFERENCES public.gift_reservations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  memory_type public.memory_type NOT NULL DEFAULT 'EVENT'::public.memory_type,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_memories_set_updated_at ON public.memories;
CREATE TRIGGER trg_memories_set_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Create Table memory_participants
CREATE TABLE IF NOT EXISTS public.memory_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'PARTICIPANT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_memory_participant UNIQUE (memory_id, user_id)
);

-- 4. Create Table memory_media
CREATE TABLE IF NOT EXISTS public.memory_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_memories_owner ON public.memories(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_memories_circle ON public.memories(circle_id);
CREATE INDEX IF NOT EXISTS idx_memories_date ON public.memories(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_memory_participants_user ON public.memory_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_media_memory ON public.memory_media(memory_id, sort_order ASC);

-- 6. RPC: get_relationship_timeline(p_profile_id UUID)
CREATE OR REPLACE FUNCTION public.get_relationship_timeline(p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_target_user_id UUID;
  v_timeline JSONB;
BEGIN
  -- Retrieve user_id for target profile
  SELECT user_id INTO v_target_user_id FROM public.gift_profiles WHERE id = p_profile_id;

  IF v_target_user_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Check RLS permission using can_view_profile
  IF NOT (
    v_target_user_id = auth.uid()
    OR public.can_view_profile(p_profile_id, 'MEMORIES'::public.profile_section)
  ) THEN
    RETURN jsonb_build_object('restricted', true, 'items', '[]'::jsonb);
  END IF;

  WITH memory_items AS (
    SELECT 
      m.id AS item_id,
      'MEMORY' AS item_kind,
      m.memory_type::text AS sub_type,
      m.title,
      m.description,
      m.cover_image_url AS image_url,
      m.event_date::text AS date,
      m.created_at,
      m.wish_id,
      w.title AS wish_title,
      (
        SELECT coalesce(jsonb_agg(jsonb_build_object(
          'id', u.id,
          'name', u.first_name || COALESCE(' ' || u.last_name, ''),
          'avatar_url', u.avatar_url
        )), '[]'::jsonb)
        FROM public.memory_participants mp
        JOIN public.users u ON u.id = mp.user_id
        WHERE mp.memory_id = m.id
      ) AS participants
    FROM public.memories m
    LEFT JOIN public.wishes w ON w.id = m.wish_id
    WHERE m.owner_user_id = v_target_user_id
       OR EXISTS (
            SELECT 1 FROM public.memory_participants mp 
            WHERE mp.memory_id = m.id AND mp.user_id = v_target_user_id
          )
  ),
  confirmed_gifts AS (
    SELECT 
      gr.id AS item_id,
      'GIFT' AS item_kind,
      'GIFT' AS sub_type,
      'Подарок получен: ' || w.title AS title,
      w.description,
      w.image_url,
      gr.confirmed_at::date::text AS date,
      gr.created_at,
      w.id AS wish_id,
      w.title AS wish_title,
      '[]'::jsonb AS participants
    FROM public.gift_reservations gr
    JOIN public.wishes w ON w.id = gr.wish_id
    WHERE w.user_id = v_target_user_id 
      AND gr.status = 'CONFIRMED'::public.gift_reservation_status
      AND gr.confirmed_at IS NOT NULL
  ),
  combined_timeline AS (
    SELECT * FROM memory_items
    UNION ALL
    SELECT * FROM confirmed_gifts
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', t.item_id,
    'kind', t.item_kind,
    'sub_type', t.sub_type,
    'title', t.title,
    'description', t.description,
    'image_url', t.image_url,
    'date', t.date,
    'created_at', t.created_at,
    'wish_id', t.wish_id,
    'wish_title', t.wish_title,
    'participants', t.participants
  ) ORDER BY t.date DESC, t.created_at DESC), '[]'::jsonb)
  INTO v_timeline
  FROM combined_timeline t;

  RETURN jsonb_build_object(
    'restricted', false,
    'items', v_timeline
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 7. Enable RLS
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memories_select_policy" ON public.memories;
CREATE POLICY "memories_select_policy" ON public.memories
  FOR SELECT USING (
    owner_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memory_participants mp 
      WHERE mp.memory_id = memories.id AND mp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.gift_profiles gp
      WHERE gp.user_id = memories.owner_user_id
        AND public.can_view_profile(gp.id, 'MEMORIES'::public.profile_section)
    )
  );

DROP POLICY IF EXISTS "memories_insert_policy" ON public.memories;
CREATE POLICY "memories_insert_policy" ON public.memories
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "memories_update_policy" ON public.memories;
CREATE POLICY "memories_update_policy" ON public.memories
  FOR UPDATE USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "memories_delete_policy" ON public.memories;
CREATE POLICY "memories_delete_policy" ON public.memories
  FOR DELETE USING (owner_user_id = auth.uid());

-- Participants RLS
DROP POLICY IF EXISTS "memory_participants_select_policy" ON public.memory_participants;
CREATE POLICY "memory_participants_select_policy" ON public.memory_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memories m WHERE m.id = memory_participants.memory_id AND m.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "memory_participants_insert_policy" ON public.memory_participants;
CREATE POLICY "memory_participants_insert_policy" ON public.memory_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memories m WHERE m.id = memory_participants.memory_id AND m.owner_user_id = auth.uid()
    )
  );

-- Media RLS
DROP POLICY IF EXISTS "memory_media_select_policy" ON public.memory_media;
CREATE POLICY "memory_media_select_policy" ON public.memory_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memories m WHERE m.id = memory_media.memory_id AND (
        m.owner_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.gift_profiles gp WHERE gp.user_id = m.owner_user_id AND public.can_view_profile(gp.id, 'MEMORIES'::public.profile_section)
        )
      )
    )
  );

DROP POLICY IF EXISTS "memory_media_insert_policy" ON public.memory_media;
CREATE POLICY "memory_media_insert_policy" ON public.memory_media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memories m WHERE m.id = memory_media.memory_id AND m.owner_user_id = auth.uid()
    )
  );

-- 8. Storage Bucket for memory images
INSERT INTO storage.buckets (id, name, public)
VALUES ('memory-images', 'memory-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public memory images select" ON storage.objects;
CREATE POLICY "Public memory images select" ON storage.objects
  FOR SELECT USING (bucket_id = 'memory-images');

DROP POLICY IF EXISTS "Authenticated users memory upload" ON storage.objects;
CREATE POLICY "Authenticated users memory upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'memory-images' AND auth.role() = 'authenticated'
  );
