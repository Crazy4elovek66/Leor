# CHANGELOG.md — Secret Circle (Leor)

All notable changes to this project will be documented in this file.

## [8.1.0] - 2026-08-08 — Sprint 8.1 (Relationship Intelligence Engine)

### Added
- **Relationship Intelligence Tables (`relationship_scores`, `relationship_events`)**: Created analytical tables for canonical pair score tracking with constraints and triggers.
- **RPC Functions (`calculate_relationship_strength`, `rebuild_relationship_scores`, `get_relationship_summary`)**: Developed PostgreSQL analytical functions computing strength, gift affinity, memory affinity, taste similarity, and years known.
- **Automatic SQL Triggers**: Enforced automatic relationship score updates upon memory insertion, gift confirmations, circle joins/leaves, and Taste Graph changes.
- **Frontend Module (`src/features/relationship/`)**: Built `RelationshipSummary.tsx` component, `useRelationshipSummary.ts` hook, and domain interfaces.
- **Profile Integration**: Embedded `RelationshipSummary` block into `/profile/:id` and public profile views.

---

## [7.0.0] - 2026-08-07 — Sprint 7 (Memories & Relationship Timeline)

### Added
- **Memories Database Schema (`memories`, `memory_participants`, `memory_media`)**: Defined tables, indexes, and PostgreSQL ENUM `memory_type` (`GIFT`, `EVENT`, `PHOTO`, `TRAVEL`, `CELEBRATION`, `ACHIEVEMENT`, `MILESTONE`, `OTHER`).
- **RPC `get_relationship_timeline`**: Created RLS-protected RPC returning a unified chronological timeline of memories and confirmed gifts.
- **Supabase Storage Bucket `memory-images`**: Added public storage bucket for memory covers and gallery images.
- **Memories Module (`src/features/memories/`)**: Built `MemoryFeedView`, `MemoryDetailsView`, `RelationshipTimeline`, `MemoryCard`, `MemoryGallery`, `CreateMemoryModal`, and React hooks.
- **Navigation Integration**: Activated `/memories` and `/memories/:id` routes and enabled the "Память" tab in `BottomNavigation.tsx`.

---

## [6.0.0] - 2026-08-06 — Sprint 6 (Public Profiles & Share Layer)

### Added
- **Public Profile Share Schema (`public_profile_shares`)**: Created table storing cryptographically secure 24+ character Base62 share tokens and section visibility flags.
- **Security-focused RPC Functions**: Implemented `create_public_share`, `rotate_public_share_token`, `disable_public_share`, `update_public_share_visibility`, and unauthenticated `get_public_profile`.
- **Public Share View (`/share/:token`)**: Developed unauthenticated screen displaying public profile information, OpenGraph meta tags, and public wishlist items without exposing internal IDs, circles, or reservations.
- **Share Management Component (`ShareSettings`)**: Integrated share link creation, one-click copying, token rotation, disabling, and section visibility toggles into `/profile`.
