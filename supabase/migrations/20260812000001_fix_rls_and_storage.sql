-- Migration: Fix RLS Infinite Recursion, Memories, and Storage Buckets
-- 1. Helper function to check circle membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_circle_member(p_circle_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_id = p_circle_id AND user_id = p_user_id
  );
$$;

-- 2. Fix RLS on public.circle_members
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "circle_members_select_policy" ON public.circle_members;
CREATE POLICY "circle_members_select_policy" ON public.circle_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_circle_member(circle_id, auth.uid())
  );

DROP POLICY IF EXISTS "circle_members_insert_policy" ON public.circle_members;
CREATE POLICY "circle_members_insert_policy" ON public.circle_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR public.is_circle_member(circle_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.circles c WHERE c.id = circle_id AND c.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "circle_members_delete_policy" ON public.circle_members;
CREATE POLICY "circle_members_delete_policy" ON public.circle_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.circles c WHERE c.id = circle_id AND c.owner_id = auth.uid())
  );

-- 3. Ensure Storage Buckets exist (wish-images, memory-images, avatars)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('wish-images', 'wish-images', true),
  ('memory-images', 'memory-images', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Storage RLS Policies for storage.objects
DROP POLICY IF EXISTS "Public Read Storage Objects" ON storage.objects;
CREATE POLICY "Public Read Storage Objects" ON storage.objects
  FOR SELECT USING (bucket_id IN ('wish-images', 'memory-images', 'avatars'));

DROP POLICY IF EXISTS "Authenticated User Upload Storage Objects" ON storage.objects;
CREATE POLICY "Authenticated User Upload Storage Objects" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND bucket_id IN ('wish-images', 'memory-images', 'avatars')
  );

DROP POLICY IF EXISTS "Authenticated User Update Storage Objects" ON storage.objects;
CREATE POLICY "Authenticated User Update Storage Objects" ON storage.objects
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND bucket_id IN ('wish-images', 'memory-images', 'avatars')
  );

DROP POLICY IF EXISTS "Authenticated User Delete Storage Objects" ON storage.objects;
CREATE POLICY "Authenticated User Delete Storage Objects" ON storage.objects
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND bucket_id IN ('wish-images', 'memory-images', 'avatars')
  );

-- 5. Fix Memories RLS policies
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memories_select_policy" ON public.memories;
CREATE POLICY "memories_select_policy" ON public.memories
  FOR SELECT USING (
    owner_user_id = auth.uid()
    OR (circle_id IS NOT NULL AND public.is_circle_member(circle_id, auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.memory_participants mp
      WHERE mp.memory_id = id AND mp.user_id = auth.uid()
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
