-- Migration: Drop Obsolete Triggers on memories table
DROP TRIGGER IF EXISTS trg_memories_rel_score ON public.memories;
DROP TRIGGER IF EXISTS trg_memories_rel_recalc ON public.memories;
DROP TRIGGER IF EXISTS trg_memories_rel_recalc_ai ON public.memories;
DROP FUNCTION IF EXISTS public.trg_recalculate_rel_on_memory() CASCADE;
DROP FUNCTION IF EXISTS public.rebuild_relationship_scores(UUID) CASCADE;
