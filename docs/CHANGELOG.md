# CHANGELOG.md — Secret Circle (Leor)

All notable changes to this project will be documented in this file.

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

---

## [4.1.0] - 2026-08-04 — Sprint 4.1 (Taste Graph Hardening)

### Added & Hardened
- **Co-occurrence Edge Engine**: Upgraded `rebuild_taste_graph()` to dynamically build edges between all co-occurring nodes (`BRAND ↔ BRAND`, `CATEGORY ↔ CATEGORY`, `CATEGORY ↔ BRAND`, `HOBBY ↔ CATEGORY`, etc.).
- **Dynamic Edge Strength Formula**: Calculated strength as `min(1.00, shared_occurrences * 0.25)`.
- **UPSERT Edge Updates & Source Tracking**: Added `source_count` column to `taste_graph_edges` table and implemented `ON CONFLICT DO UPDATE` without deleting active edges.
- **Graph Density Protection**: Enforced a hard limit of max 1000 edges per user, preserving only the highest strength edges.
