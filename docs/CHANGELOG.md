# CHANGELOG.md — Secret Circle (Leor)

All notable changes to this project will be documented in this file.

## [4.1.0] - 2026-08-04 — Sprint 4.1 (Taste Graph Hardening)

### Added & Hardened
- **Co-occurrence Edge Engine**: Upgraded `rebuild_taste_graph()` to dynamically build edges between all co-occurring nodes (`BRAND ↔ BRAND`, `CATEGORY ↔ CATEGORY`, `CATEGORY ↔ BRAND`, `HOBBY ↔ CATEGORY`, etc.).
- **Dynamic Edge Strength Formula**: Calculated strength as `min(1.00, shared_occurrences * 0.25)`.
- **UPSERT Edge Updates & Source Tracking**: Added `source_count` column to `taste_graph_edges` table and implemented `ON CONFLICT DO UPDATE` without deleting active edges.
- **Graph Density Protection**: Enforced a hard limit of max 1000 edges per user, preserving only the highest strength edges.

---

## [4.0.0] - 2026-08-04 — Sprint 4 (Taste Graph MVP)

### Added
- **Taste Graph Schema & ENUMs**: Created `taste_graph_nodes`, `taste_graph_edges` tables and `taste_node_type` ENUM (`BRAND`, `CATEGORY`, `STYLE`, `COLOR`, etc.).
- **PL/pgSQL Weight Engine**: Implemented `calculate_taste_weight()` (range 0.00 – 1.00) and `rebuild_taste_graph()` procedures.
- **Automated DB Triggers**: Added triggers on `wishes` and `taste_items` to automatically rebuild user graph upon changes.
- **RPC `get_taste_graph`**: Created RLS-protected RPC returning nodes, edges, top categories, and top preferred brands.
- **Frontend Module (`src/features/taste/`)**: Developed `TasteGraphView`, `TasteCategoryCloud`, `TasteBrandList`, `TasteStrengthBar`, and `useTasteGraph` hook. Integrated Taste Graph block into profile pages (`/profile` and `/profile/:id`).

---

## [3.2.0] - 2026-08-03 — Sprint 3.2 (UX Polish)

### Added & Improved
- **Optimistic UI with Rollback**: Instant status transitions (`RESERVED_BY_ME`, `AVAILABLE`, `CONFIRMED`) with automatic state rollback on RPC failures.
- **Loading & Skeleton States**: Added pulse skeletons, disabled button states, and `Loader2` spinners during pending RPC operations.
- **Sonner Toast Copy**: Refined Russian toast messages for all reservation actions and error cases.
- **Shared 1-Minute Timer (`useMinuteTimer`)**: Optimized timer updates to execute once every 60 seconds (60,000ms) for battery efficiency.
- **Section-specific Empty States**: Added custom empty states on `/reservations` for Active Reservations, Confirmed Purchases, and History.
- **Accessibility & Focus Styles**: Added `aria-label`, keyboard focus indicators, and contrast handling for disabled controls.

---

## [3.0.0] - 2026-08-03 — Sprint 3 (Gift Reservations MVP)

### Added
- **Gift Reservations Module (`src/features/reservation/`)**: Created reservation types, RPC hooks (`useWishReservations`, `useMyReservations`), Realtime hook (`useReservationRealtime`), and `formatCountdown` utility.
- **WishCard State Integration**: Integrated 4 reservation states (`AVAILABLE`, `RESERVED`, `RESERVED_BY_ME`, `CONFIRMED`) with dusty rose `#D8B4B0` styling for circle members while strictly keeping the card standard for the wishlist owner.
- **Giver Dashboard (`/reservations`)**: Implemented `MyReservationsView` categorized into Active Reservations, Confirmed Purchases, and History.
- **Timer Countdown**: Display remaining reservation time until 72h expiry (`71ч`, `18ч`, `43м`).

---

## [3.1.0] - 2026-08-03 — Sprint 3.1 (Reservation Hardening)

### Added & Hardened
- **PostgreSQL Table `gift_reservations`**: Created reservation table with partial unique index `uq_active_gift_reservation` preventing duplicate active reservations.
- **SQL View `wish_reservation_status`**: Aggregated view without `reserved_by` field for privacy preservation.
- **Atomic RPC Functions**: `get_wish_reservation_state()`, `reserve_wish()`, `cancel_reservation()`, `confirm_reservation()`, and `expire_old_reservations()`.
- **Strict RLS Policies**: Denies access to wishlist owners for their own gift reservations.
- **Realtime Integration**: Target wish reservation state updates via `useReservationRealtime()`.
