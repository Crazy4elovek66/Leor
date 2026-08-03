-- Migration: Fix Circles RLS Select Policy and Memories RLS
-- 1. Fix circles_select_policy so owner can immediately SELECT after INSERT
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "circles_select_policy" ON public.circles;
CREATE POLICY "circles_select_policy" ON public.circles
  FOR SELECT USING (
    owner_id = auth.uid()
    OR public.is_circle_member(id, auth.uid())
  );

DROP POLICY IF EXISTS "circles_insert_policy" ON public.circles;
CREATE POLICY "circles_insert_policy" ON public.circles
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- 2. Fix memories RLS policies
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
  FOR INSERT WITH CHECK (
    owner_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "memories_update_policy" ON public.memories;
CREATE POLICY "memories_update_policy" ON public.memories
  FOR UPDATE USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "memories_delete_policy" ON public.memories;
CREATE POLICY "memories_delete_policy" ON public.memories
  FOR DELETE USING (owner_user_id = auth.uid());

-- 3. Grant table permissions to authenticated role
GRANT ALL ON public.circles TO authenticated;
GRANT ALL ON public.circle_members TO authenticated;
GRANT ALL ON public.circle_accesses TO authenticated;
GRANT ALL ON public.memories TO authenticated;
GRANT ALL ON public.memory_participants TO authenticated;
GRANT ALL ON public.memory_media TO authenticated;
