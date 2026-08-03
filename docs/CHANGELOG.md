# CHANGELOG.md — Secret Circle (Leor)

All notable changes to this project will be documented in this file.

## [2.2.0] - 2026-08-11 — Leor Core v2.2 Cleanup (Full Rollback & Freeze)

### Removed
- **Phase 2 Analytics Tables**: Removed `relationship_scores`, `relationship_events`, `relationship_milestones`, `lifecycle_notifications`, and `relationship_activity_metrics` from database schema.
- **Analytics RPC Functions**: Removed `calculate_relationship_strength`, `rebuild_relationship_scores`, `get_relationship_summary`, `get_relationship_timeline_v2`, `get_relationship_journal`, `calculate_relationship_anniversary`, `get_relationship_activity`, `get_upcoming_relationship_events`, and `detect_relationship_inactivity`.
- **Frontend Analytics Modules**: Completely deleted `src/features/relationship/`, `src/features/relationship-timeline/`, and `src/features/lifecycle/`.
- **UI Metrics**: Removed friendship percentage indicators, relationship health status badges, and artificial inactivity nudges.

### Added
- **Core Architecture Freeze (`docs/cleanup/LEOR_CORE_v2.2.md`)**: Restored application focus strictly to PRODUCT_SPEC_v2.1_FROZEN.md (8 Core Domains: Auth, Gift Profile, Circle, Wishlist, Gift Reservations, Taste Graph, Discovery Feed, Memories).

---

## [7.0.0] - 2026-08-07 — Sprint 7 (Memories & Relationship Timeline)

### Added
- **Memories Database Schema (`memories`, `memory_participants`, `memory_media`)**: Defined tables, indexes, and PostgreSQL ENUM `memory_type` (`GIFT`, `EVENT`, `PHOTO`, `TRAVEL`, `CELEBRATION`, `ACHIEVEMENT`, `MILESTONE`, `OTHER`).
- **RPC `get_relationship_timeline`**: Created RLS-protected RPC returning a unified chronological timeline of memories and confirmed gifts.
- **Supabase Storage Bucket `memory-images`**: Added public storage bucket for memory covers and gallery images.
- **Memories Module (`src/features/memories/`)**: Built `MemoryFeedView`, `MemoryDetailsView`, `RelationshipTimeline`, `MemoryCard`, `MemoryGallery`, `CreateMemoryModal`, and React hooks.
