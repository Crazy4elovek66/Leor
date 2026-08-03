# CHANGELOG.md — Secret Circle (Leor)

All notable changes to this project will be documented in this file.

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

---

## [5.1.0] - 2026-08-05 — Sprint 5.1 (Discovery Hardening)

### Added & Hardened
- **Recommendation Diversity & Circle Balance**: Enforced maximum candidate limits per category (max 3) and per owner (max 2) using PostgreSQL window functions.
- **Freshness Boost**: Added dynamic score boost of up to +10% for wishes created in the last 14 days.
- **Stable Ordering**: Guaranteed deterministic sorting using `score DESC`, `freshness_boost DESC`, `created_at DESC`.
- **Explainability Optimization**: Limited `reasons` to max 3 unique, prioritized entries (Brand &rarr; Category &rarr; Taste Graph &rarr; Circle name).
- **Performance Indexes**: Added `idx_wishes_user_status_created` and `idx_circle_members_user_circle` composite indexes.
