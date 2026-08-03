# CHANGELOG.md — Secret Circle (Leor)

All notable changes to this project will be documented in this file.

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

---

## [5.0.0] - 2026-08-05 — Sprint 5 (Gift Discovery Engine MVP)

### Added
- **SQL Discovery Engine (`get_discovery_feed`)**: Created RPC function generating personalized gift recommendations by matching the user's Taste Graph against active wishlist items from circle peers.
- **Scoring & Explanation Engine**: Implemented 0–100 match score formula combining node weight (50%), edge strength (30%), and wish priority (20%), alongside automated reasons generation.
- **Discovery Module (`src/features/discovery/`)**: Built `DiscoveryCard`, `DiscoveryFeedView`, `useDiscoveryFeed` hook, and domain types.
- **`/discover` Route & Bottom Navigation**: Added protected `/discover` route and active "Открытия" tab in `BottomNavigation.tsx`.
