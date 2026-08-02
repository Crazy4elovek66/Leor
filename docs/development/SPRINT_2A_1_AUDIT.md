# SPRINT_2A_1_AUDIT.md — Аудит реализации Sprint 2A.1 (Access Hardening)

Этот документ содержит полный технический аудит результатов разработки **Sprint 2A.1 (Access Hardening)** проекта **Secret Circle (Leor)**.

---

## 1. Обзор Sprint 2A.1

Sprint 2A.1 направлен на финальное укрепление консистентности и безопасности матрицы доступа `CircleAccess` перед переходом к реализации системы желаний в Sprint 2B (Wishlist).

---

## 2. SQL Миграция (`supabase/migrations/20260802000004_sprint_2a_1_access_hardening.sql`)

### 2.1. Исключение доступа архивированных кругов
Обновленная функция `check_circle_access` в обязательном порядке проверяет `c.is_archived = false`:

```sql
CREATE OR REPLACE FUNCTION public.check_circle_access(
  p_profile_id UUID,
  p_section public.profile_section DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_owner_user_id UUID;
BEGIN
  SELECT user_id INTO v_owner_user_id
  FROM public.gift_profiles
  WHERE id = p_profile_id;

  IF v_owner_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.circle_accesses ca
    JOIN public.circles c ON c.id = ca.circle_id
    JOIN public.circle_members cm_target ON cm_target.circle_id = ca.circle_id AND cm_target.user_id = v_owner_user_id
    JOIN public.circle_members cm_viewer ON cm_viewer.circle_id = ca.circle_id AND cm_viewer.user_id = auth.uid()
    WHERE ca.profile_id = p_profile_id
      AND c.is_archived = false
      AND (p_section IS NULL OR ca.section = p_section)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;
```

---

## 3. Усиление RLS для `circle_accesses`

Защита от попыток выдать доступ к своему профилю через чужой круг. Пользователь может добавлять или удалять разрешения `circle_accesses` только для кругов, где он сам является активным участником:

```sql
CREATE POLICY "circle_accesses_insert_policy" ON public.circle_accesses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.gift_profiles gp WHERE gp.id = profile_id AND gp.user_id = auth.uid())
    AND
    EXISTS (SELECT 1 FROM public.circle_members cm WHERE cm.circle_id = circle_accesses.circle_id AND cm.user_id = auth.uid())
  );

CREATE POLICY "circle_accesses_delete_policy" ON public.circle_accesses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.gift_profiles gp WHERE gp.id = profile_id AND gp.user_id = auth.uid())
    AND
    EXISTS (SELECT 1 FROM public.circle_members cm WHERE cm.circle_id = circle_accesses.circle_id AND cm.user_id = auth.uid())
  );
```

---

## 4. Подтверждённые индексы производительности

Все ключевые связи `check_circle_access` покрыты B-Tree индексами:
- `idx_circle_members_user` &rarr; `circle_members(user_id)`
- `idx_circle_members_circle` &rarr; `circle_members(circle_id)`
- `idx_circle_accesses_profile` &rarr; `circle_accesses(profile_id)`
- `idx_circle_accesses_circle_section` &rarr; `circle_accesses(circle_id, section)`
- `idx_circles_owner` &rarr; `circles(owner_id)`

---

## 5. Выполнение Definition of Done

- [x] Архивированные круги моментально прекращают доступ к секциям профилей.
- [x] Владелец профиля не может выдать доступ через круг, членом которого он не является.
- [x] Все 5 индексов производительности подтверждены.
- [x] Проект проходит проверку типов (`npm run typecheck`) и сборку (`npm run build` за 3.16с).
- [x] 100% совместимость с бесплатными тарифами **Supabase Free Tier** и **Vercel**.
