-- Migration: Leor Core v2.2 Architectural Cleanup
-- Complete removal of Phase 2 analytics (relationship_scores, relationship_events, relationship_milestones, lifecycle_notifications, relationship_activity_metrics)
-- Restoring Leor strictly to PRODUCT_SPEC_v2.1_FROZEN.md

-- 1. Drop Triggers & Trigger Functions
DROP TRIGGER IF EXISTS trg_memories_rel_score ON public.memories;
DROP FUNCTION IF EXISTS public.trg_recalculate_rel_on_memory();

-- 2. Drop RPC Functions
DROP FUNCTION IF EXISTS public.calculate_relationship_strength(UUID, UUID);
DROP FUNCTION IF EXISTS public.rebuild_relationship_scores(UUID);
DROP FUNCTION IF EXISTS public.get_relationship_summary(UUID);
DROP FUNCTION IF EXISTS public.get_relationship_timeline_v2(UUID);
DROP FUNCTION IF EXISTS public.get_relationship_journal(UUID);
DROP FUNCTION IF EXISTS public.calculate_relationship_anniversary(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_relationship_activity(UUID);
DROP FUNCTION IF EXISTS public.get_upcoming_relationship_events(UUID);
DROP FUNCTION IF EXISTS public.detect_relationship_inactivity(UUID);

-- 3. Drop RLS Policies
DROP POLICY IF EXISTS "rel_scores_select_policy" ON public.relationship_scores;
DROP POLICY IF EXISTS "rel_events_select_policy" ON public.relationship_events;
DROP POLICY IF EXISTS "rel_milestones_select_policy" ON public.relationship_milestones;
DROP POLICY IF EXISTS "lifecycle_notifications_policy" ON public.lifecycle_notifications;
DROP POLICY IF EXISTS "relationship_anniversaries_policy" ON public.relationship_anniversaries;
DROP POLICY IF EXISTS "relationship_activity_metrics_policy" ON public.relationship_activity_metrics;

-- 4. Drop Tables
DROP TABLE IF EXISTS public.relationship_activity_metrics CASCADE;
DROP TABLE IF EXISTS public.relationship_anniversaries CASCADE;
DROP TABLE IF EXISTS public.lifecycle_notifications CASCADE;
DROP TABLE IF EXISTS public.relationship_milestones CASCADE;
DROP TABLE IF EXISTS public.relationship_events CASCADE;
DROP TABLE IF EXISTS public.relationship_scores CASCADE;
