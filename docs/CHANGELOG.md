# CHANGELOG.md — Secret Circle (Leor)

All notable changes to this project will be documented in this file.

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
