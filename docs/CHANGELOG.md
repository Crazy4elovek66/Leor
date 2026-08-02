# CHANGELOG.md — Secret Circle (Leor)

All notable changes to this project will be documented in this file.

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

---

## [2.1.0] - 2026-08-02 — Sprint 2B (Wishlist MVP / Gift Card)

### Added
- **Wishlist Schema & ENUMs**: Defined `wishes` table and ENUMs (`wish_category` with `EXPERIENCE`, `wish_priority`, `wish_status`, `wish_source`, `wish_context`).
- **Brand & Surprise Fields**: Added `brand`, `is_surprise_friendly`, and `source_type` columns.
- **Supabase Storage `wish-images`**: Added public image bucket for wish covers.
- **Size Resolution Helper**: Created `resolveWishSize(category, profile_sizes, override)` helper.
- **RLS Policy Protection**: Integrated `wishes_select_policy` with `can_view_profile(gp.id, 'WISHLIST')`.

---

## [2.0.1] - 2026-08-02 — Sprint 2A.1 (Access Hardening)

### Added & Hardened
- **Archived Circle Access Protection**: Updated `public.check_circle_access()` with `JOIN public.circles c` enforcing `c.is_archived = false`. Archived circles immediately revoke access to all profile sections.
- **CircleAccess RLS Ownership Validation**: Hardened `circle_accesses_insert_policy` and `circle_accesses_delete_policy` RLS rules ensuring a user can only grant or revoke section access for their own profile within circles where they are an active member.
- **Index Verification**: Verified B-Tree indexes (`idx_circle_members_user`, `idx_circle_members_circle`, `idx_circle_accesses_profile`, `idx_circle_accesses_circle_section`, `idx_circles_owner`).

---

## [2.0.0] - 2026-08-02 — Sprint 2A (Social Graph)

### Added
- **PostgreSQL Tables & ENUMs**: Added `circles`, `circle_members`, `circle_accesses` tables and `circle_role` (`OWNER`, `MEMBER`), `profile_section` (`BASIC_INFO`, `INTERESTS`, `SIZES`, `WISHLIST`, `MEMORIES`) ENUMs.
- **Automatic Owner Trigger**: Implemented `handle_circle_owner_member()` DB trigger for auto-inserting circle creator as `OWNER`.
- **Deno Edge Function `circle-invite`**: Cryptographically secure Base62 10-char invite code generation, validation, and joining with replay/archive protection.
- **`check_circle_access` RLS Function**: Activated full `EXISTS` check across `circle_accesses` and `circle_members`.
- **Circles UI Module (`src/features/circle/`)**: Created `/circles`, `/circles/:id`, `/profile/:id` routes, `CircleList`, `CircleCard`, `CircleDetailsView`, `AccessMatrixModal`, and `MemberProfileView` components.

---

## [1.2.0] - 2026-08-02 — Sprint 1.2 (Foundation Freeze)

### Added
- **Sectional Privacy Support**: Updated `public.can_view_profile(p_profile_id UUID, p_section TEXT DEFAULT NULL)` to support granular section access (`BASIC_INFO`, `INTERESTS`, `SIZES`, `WISHLIST`, `MEMORIES`).
- **Circle Access Architectural Stub**: Added `public.check_circle_access(p_profile_id UUID, p_section TEXT DEFAULT NULL)` stub function.
- **`SECURITY DEFINER` Hardening**: Enforced `SET search_path = public` on all database PL/pgSQL functions.
- **Explicit RLS Operation Policies**: Refactored RLS policies into explicit `SELECT` (`USING`), `INSERT` (`WITH CHECK`), `UPDATE` (`USING` & `WITH CHECK`), and `DELETE` (`USING`).
- **Public Profile View**: Created `public.gift_profile_public` SQL view.
- **Foundation Freeze Documentation**: Created [`docs/development/FOUNDATION_FREEZE.md`](./development/FOUNDATION_FREEZE.md) defining immutable design rules and Sprint 2 extension guidelines.

---

## [1.1.0] - 2026-08-02 — Sprint 1.1 (Hardening)

### Added
- **PostgreSQL ENUM Types**: `visibility_level`, `size_category`, `taste_category`.
- **CHECK Constraints**: `gift_profiles.bio` (<=500 chars), `gift_profiles.city` (<=100 chars), `profile_sizes.value` (<=100 chars), `taste_items.weight` (> 0).
- **`updated_at` Automatic Triggers**: Reusable PL/pgSQL function `set_updated_at()` and BEFORE UPDATE triggers on `users`, `gift_profiles`, `taste_items`.
- **UNIQUE Constraints**: `uq_taste_items_profile_category_title` and `uq_profile_sizes_profile_category`.
- **RLS Helper Function**: `public.can_view_profile(p_profile_id UUID)` with SECURITY DEFINER for future Circle access expansion.
- **SQL Profile Completeness**: `public.calculate_profile_completeness(p_profile_id UUID)` calculate % in database layer.
- **Telegram Auth Security**: Replay attack protection via `auth_date` check (TTL 86400s / 24h), `initData` normalization, error handling, strict token isolation.
- **Database Optimization**: Added indexes `idx_gift_profiles_user_id`, `idx_profile_sizes_profile_id`, `idx_taste_items_profile_id`, `idx_current_focuses_profile_id`, `idx_anti_gift_preferences_profile_id`, and table/type SQL comments.

---

## [1.0.0] - 2026-08-02 — Sprint 1 (Foundation)

### Added
- Initialized React 19 + Vite 7 + Tailwind CSS v4 + TypeScript project.
- Implemented Supabase JS client and Deno Edge Function `telegram-auth` for Telegram WebApp HMAC authentication.
- Created database schema v2.1 in `snake_case` (`users`, `gift_profiles`, `profile_sizes`, `taste_items`, `current_focuses`, `anti_gift_preferences`) with RLS policies.
- Built Onboarding Carousel (3 slides) and Telegram WebApp Safe Container layout.
- Developed Gift Profile view, basic info editing, preset interests selector grid (9 categories), and sizes section.
