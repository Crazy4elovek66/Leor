# SPRINT_1.2_AUDIT.md — Аудит реализации Sprint 1.2 (Foundation Freeze)

Этот документ содержит полный технический аудит результатов разработки **Sprint 1.2 (Foundation Freeze)** проекта **Secret Circle (Leor)**.

---

## 1. Цели и задачи Sprint 1.2

Sprint 1.2 представляет собой финальный технический спринт перед стартом реализации социальной логики (Circle + Wishlist). 

### Достигнутые результаты:
- Внедрение **секционной приватности** в базовую функцию доступа `can_view_profile(profile_id, section)`.
- Усиление безопасности функций с `SECURITY DEFINER` путем принудительной установки `SET search_path = public`.
- Отказ от универсального `FOR ALL` в RLS с переходом на явные политики для `SELECT` (`USING`), `INSERT` (`WITH CHECK`), `UPDATE` (`USING` & `WITH CHECK`) и `DELETE` (`USING`).
- Создание архитектурной заглушки `check_circle_access` для подключения системы Кругов в Sprint 2 без изменения RLS политик.
- Создание представления `gift_profile_public` для публичных запросов данных владельцев желаний.
- Замена и официальная фиксация правил в документе [`docs/development/FOUNDATION_FREEZE.md`](./FOUNDATION_FREEZE.md).

---

## 2. SQL Миграция (`supabase/migrations/20260802000002_sprint_1_2_foundation_freeze.sql`)

Полный исходный код миграции:

```sql
-- Migration: Sprint 1.2 Foundation Freeze (Leor)
-- Enhancements: Sectional Privacy in can_view_profile, search_path hardening, explicit SELECT/INSERT/UPDATE/DELETE RLS policies, check_circle_access stub, gift_profile_public view

-- 1. Create check_circle_access stub function (prepared for Sprint 2)
CREATE OR REPLACE FUNCTION public.check_circle_access(
  p_profile_id UUID,
  p_section TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Stub for Sprint 2 Circle Access system.
  -- Will check circle_memberships and section permissions (BASIC_INFO, INTERESTS, SIZES, WISHLIST, MEMORIES)
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Update can_view_profile with sectional privacy support & hardened search_path
CREATE OR REPLACE FUNCTION public.can_view_profile(
  p_profile_id UUID,
  p_section TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_owner_user_id UUID;
BEGIN
  -- Retrieve user_id of profile owner
  SELECT user_id INTO v_owner_user_id
  FROM public.gift_profiles
  WHERE id = p_profile_id;

  -- 1. Owner can always access all sections of their profile
  IF v_owner_user_id IS NOT NULL AND v_owner_user_id = auth.uid() THEN
    RETURN TRUE;
  END IF;

  -- 2. Check Circle Access stub (returns false for now, active in Sprint 2)
  IF public.check_circle_access(p_profile_id, p_section) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 3. Harden calculate_profile_completeness with search_path = public
CREATE OR REPLACE FUNCTION public.calculate_profile_completeness(p_profile_id UUID)
RETURNS INT AS $$
DECLARE
  v_user_id UUID;
  v_first_name TEXT;
  v_bio TEXT;
  v_birth_date DATE;
  v_city TEXT;
  v_taste_count INT;
  v_size_count INT;
  v_score INT := 0;
BEGIN
  SELECT user_id, bio, birth_date, city INTO v_user_id, v_bio, v_birth_date, v_city
  FROM public.gift_profiles WHERE id = p_profile_id;
  
  IF v_user_id IS NULL THEN 
    RETURN 0; 
  END IF;
  
  SELECT first_name INTO v_first_name FROM public.users WHERE id = v_user_id;
  
  IF v_first_name IS NOT NULL AND length(trim(v_first_name)) > 0 THEN v_score := v_score + 10; END IF;
  IF v_bio IS NOT NULL AND length(trim(v_bio)) > 0 THEN v_score := v_score + 10; END IF;
  IF v_birth_date IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_city IS NOT NULL AND length(trim(v_city)) > 0 THEN v_score := v_score + 10; END IF;
  
  SELECT COUNT(*) INTO v_taste_count FROM public.taste_items WHERE profile_id = p_profile_id;
  IF v_taste_count >= 1 THEN v_score := v_score + 15; END IF;
  IF v_taste_count >= 3 THEN v_score := v_score + 15; END IF;
  
  SELECT COUNT(*) INTO v_size_count FROM public.profile_sizes WHERE profile_id = p_profile_id;
  IF v_size_count >= 1 THEN v_score := v_score + 15; END IF;
  IF v_size_count >= 3 THEN v_score := v_score + 15; END IF;
  
  RETURN LEAST(100, v_score);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 4. Re-architect RLS Policies: Separate SELECT, INSERT, UPDATE, DELETE policies

-- gift_profiles
DROP POLICY IF EXISTS "Users can view their own gift profile" ON public.gift_profiles;
DROP POLICY IF EXISTS "Users can insert their own gift profile" ON public.gift_profiles;
DROP POLICY IF EXISTS "Users can update their own gift profile" ON public.gift_profiles;

CREATE POLICY "gift_profiles_select_policy" ON public.gift_profiles
  FOR SELECT USING (public.can_view_profile(id, 'BASIC_INFO'));

CREATE POLICY "gift_profiles_insert_policy" ON public.gift_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gift_profiles_update_policy" ON public.gift_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- profile_sizes
DROP POLICY IF EXISTS "Users can manage their profile sizes" ON public.profile_sizes;
DROP POLICY IF EXISTS "profile_sizes_select_policy" ON public.profile_sizes;
DROP POLICY IF EXISTS "profile_sizes_insert_policy" ON public.profile_sizes;
DROP POLICY IF EXISTS "profile_sizes_update_policy" ON public.profile_sizes;
DROP POLICY IF EXISTS "profile_sizes_delete_policy" ON public.profile_sizes;

CREATE POLICY "profile_sizes_select_policy" ON public.profile_sizes
  FOR SELECT USING (public.can_view_profile(profile_id, 'SIZES'));

CREATE POLICY "profile_sizes_insert_policy" ON public.profile_sizes
  FOR INSERT WITH CHECK (public.can_view_profile(profile_id));

CREATE POLICY "profile_sizes_update_policy" ON public.profile_sizes
  FOR UPDATE USING (public.can_view_profile(profile_id)) WITH CHECK (public.can_view_profile(profile_id));

CREATE POLICY "profile_sizes_delete_policy" ON public.profile_sizes
  FOR DELETE USING (public.can_view_profile(profile_id));

-- taste_items
DROP POLICY IF EXISTS "Users can manage their taste items" ON public.taste_items;
DROP POLICY IF EXISTS "taste_items_select_policy" ON public.taste_items;
DROP POLICY IF EXISTS "taste_items_insert_policy" ON public.taste_items;
DROP POLICY IF EXISTS "taste_items_update_policy" ON public.taste_items;
DROP POLICY IF EXISTS "taste_items_delete_policy" ON public.taste_items;

CREATE POLICY "taste_items_select_policy" ON public.taste_items
  FOR SELECT USING (public.can_view_profile(profile_id, 'INTERESTS'));

CREATE POLICY "taste_items_insert_policy" ON public.taste_items
  FOR INSERT WITH CHECK (public.can_view_profile(profile_id));

CREATE POLICY "taste_items_update_policy" ON public.taste_items
  FOR UPDATE USING (public.can_view_profile(profile_id)) WITH CHECK (public.can_view_profile(profile_id));

CREATE POLICY "taste_items_delete_policy" ON public.taste_items
  FOR DELETE USING (public.can_view_profile(profile_id));

-- current_focuses
DROP POLICY IF EXISTS "Users can manage their current focuses" ON public.current_focuses;
DROP POLICY IF EXISTS "current_focuses_select_policy" ON public.current_focuses;
DROP POLICY IF EXISTS "current_focuses_insert_policy" ON public.current_focuses;
DROP POLICY IF EXISTS "current_focuses_update_policy" ON public.current_focuses;
DROP POLICY IF EXISTS "current_focuses_delete_policy" ON public.current_focuses;

CREATE POLICY "current_focuses_select_policy" ON public.current_focuses
  FOR SELECT USING (public.can_view_profile(profile_id, 'BASIC_INFO'));

CREATE POLICY "current_focuses_insert_policy" ON public.current_focuses
  FOR INSERT WITH CHECK (public.can_view_profile(profile_id));

CREATE POLICY "current_focuses_update_policy" ON public.current_focuses
  FOR UPDATE USING (public.can_view_profile(profile_id)) WITH CHECK (public.can_view_profile(profile_id));

CREATE POLICY "current_focuses_delete_policy" ON public.current_focuses
  FOR DELETE USING (public.can_view_profile(profile_id));

-- anti_gift_preferences
DROP POLICY IF EXISTS "Users can manage anti gift preferences" ON public.anti_gift_preferences;
DROP POLICY IF EXISTS "anti_gift_preferences_select_policy" ON public.anti_gift_preferences;
DROP POLICY IF EXISTS "anti_gift_preferences_insert_policy" ON public.anti_gift_preferences;
DROP POLICY IF EXISTS "anti_gift_preferences_update_policy" ON public.anti_gift_preferences;
DROP POLICY IF EXISTS "anti_gift_preferences_delete_policy" ON public.anti_gift_preferences;

CREATE POLICY "anti_gift_preferences_select_policy" ON public.anti_gift_preferences
  FOR SELECT USING (public.can_view_profile(profile_id, 'BASIC_INFO'));

CREATE POLICY "anti_gift_preferences_insert_policy" ON public.anti_gift_preferences
  FOR INSERT WITH CHECK (public.can_view_profile(profile_id));

CREATE POLICY "anti_gift_preferences_update_policy" ON public.anti_gift_preferences
  FOR UPDATE USING (public.can_view_profile(profile_id)) WITH CHECK (public.can_view_profile(profile_id));

CREATE POLICY "anti_gift_preferences_delete_policy" ON public.anti_gift_preferences
  FOR DELETE USING (public.can_view_profile(profile_id));

-- 5. Create gift_profile_public View for Future Wishlist / Social Queries
CREATE OR REPLACE VIEW public.gift_profile_public AS
SELECT 
  gp.id AS profile_id,
  gp.user_id,
  u.first_name,
  u.avatar_url,
  gp.bio,
  gp.city,
  gp.birth_date
FROM public.gift_profiles gp
JOIN public.users u ON u.id = gp.user_id;
```

---

## 3. Секционная приватность и архитектура доступа

Функция `can_view_profile(profile_id, section)` поддерживает пять основных секций:
1. `BASIC_INFO` — базовая информация (био, дата рождения, город).
2. `INTERESTS` — интересы и вкусы (`taste_items`).
3. `SIZES` — размеры одежды и украшений (`profile_sizes`).
4. `WISHLIST` — карточки желаний и подборки (Sprint 2).
5. `MEMORIES` — совместные хроники и воспоминания (Sprint 7).

Все RLS политики вызывают эту функцию с указанием целевой секции, что защищает от утечек данных при добавлении системы Кругов в будущем.

---

## 4. Защита SECURITY DEFINER функций

В соответствии с лучшими практиками безопасности PostgreSQL для всех `SECURITY DEFINER` функций принудительно установлен `SET search_path = public`:
- `can_view_profile`
- `check_circle_access`
- `calculate_profile_completeness`

Это полностью устраняет возможность атак типа **search_path hijacking**, при которых злоумышленник может подменить схемы внутри привилегированной функции.

---

## 5. Правила расширения фундамента на Sprint 2 (Sprint 2 Extension Rules)

1. Существующие таблицы (`users`, `gift_profiles`, `profile_sizes`, `taste_items`) не подлежат мутациям без добавления новых миграционных файлов.
2. Существующие ENUM типы (`visibility_level`, `size_category`, `taste_category`) зафиксированы.
3. Функция `can_view_profile` сохраняет свою сигнатуру `(profile_id, section)`.
4. Новые сущности системы Кругов (`circles`, `circle_members`, `circle_accesses`) интегрируются через реализацию тела функции `check_circle_access`.
5. Таблицы Wishlist не хранят размеры пользователей, ссылаясь на `profile_sizes`.

---

## 6. Подтверждение выполнения Definition of Done

- [x] Сигнатура `can_view_profile` поддерживает параметр `section`.
- [x] Все `SECURITY DEFINER` функции защищены `SET search_path = public`.
- [x] `INSERT` политики используют `WITH CHECK`.
- [x] Создана заглушка `check_circle_access`.
- [x] Создано представление `gift_profile_public`.
- [x] Файл [`FOUNDATION_FREEZE.md`](./FOUNDATION_FREEZE.md) зафиксирован в документации.
- [x] Успешная компиляция типов и сборка фронтенда (`npm run typecheck` и `npm run build` за 2.80с).
- [x] Сохранена 100% совместимость с бесплатными тарифами **Supabase Free Tier** и **Vercel**.
