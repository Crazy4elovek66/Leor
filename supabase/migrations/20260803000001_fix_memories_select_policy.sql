-- Fix critical bug in memories_select_policy: mp.memory_id = mp.id → mp.memory_id = memories.id
-- The old policy compared memory_participants columns to themselves, making the third OR branch always false.

DROP POLICY IF EXISTS memories_select_policy ON public.memories;
CREATE POLICY memories_select_policy ON public.memories
  FOR SELECT USING (
    (owner_user_id = auth.uid())
    OR ((circle_id IS NOT NULL) AND is_circle_member(circle_id, auth.uid()))
    OR (EXISTS (
      SELECT 1 FROM memory_participants mp
      WHERE mp.memory_id = memories.id AND mp.user_id = auth.uid()
    ))
  );
