# SPRINT_2A_AUDIT.md — Аудит реализации Sprint 2A (Social Graph)

Этот документ содержит полный технический и продуктовый аудит результатов разработки **Sprint 2A (Social Graph)** проекта **Secret Circle (Leor)**.

---

## 1. Обзор Sprint 2A

В рамках Sprint 2A реализована полная архитектура социального графа:
- Создание и хранение кругов пользователей (Circles).
- Автоматическое назначение создателя ролью `OWNER` через триггер БД.
- Бессерверные приглашения в круги через Deno Edge Function `circle-invite` (Base62 10–12 символов).
- Матрица переключателей секционного доступа к карточке профиля (`circle_accesses`).
- Просмотр чужих карт Gift Profile (`/profile/:id`) под защитой PostgreSQL RLS функции `check_circle_access`.

---

## 2. Список новых таблиц и ENUM типов

### 2.1. PostgreSQL ENUM типы
- `public.circle_role`: `'OWNER'`, `'MEMBER'`
- `public.profile_section`: `'BASIC_INFO'`, `'INTERESTS'`, `'SIZES'`, `'WISHLIST'`, `'MEMORIES'`

### 2.2. Таблицы в `snake_case`

#### 1. `public.circles`
- `id`: UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
- `name`: TEXT NOT NULL (CHECK `length(name) <= 100`)
- `avatar_url`: TEXT
- `owner_id`: UUID NOT NULL REFERENCES `public.users(id)` ON DELETE CASCADE
- `invite_code`: TEXT UNIQUE NOT NULL (Base62 10 символов)
- `is_archived`: BOOLEAN NOT NULL DEFAULT `false`
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT `now()`
- `updated_at`: TIMESTAMPTZ NOT NULL DEFAULT `now()`

#### 2. `public.circle_members`
- `id`: UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
- `circle_id`: UUID NOT NULL REFERENCES `public.circles(id)` ON DELETE CASCADE
- `user_id`: UUID NOT NULL REFERENCES `public.users(id)` ON DELETE CASCADE
- `role`: `public.circle_role` NOT NULL DEFAULT `'MEMBER'`
- `joined_at`: TIMESTAMPTZ NOT NULL DEFAULT `now()`
- `CONSTRAINT uq_circle_members_circle_user UNIQUE(circle_id, user_id)`

#### 3. `public.circle_accesses`
- `id`: UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
- `circle_id`: UUID NOT NULL REFERENCES `public.circles(id)` ON DELETE CASCADE
- `profile_id`: UUID NOT NULL REFERENCES `public.gift_profiles(id)` ON DELETE CASCADE
- `section`: `public.profile_section` NOT NULL
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT `now()`
- `CONSTRAINT uq_circle_accesses_circle_profile_section UNIQUE(circle_id, profile_id, section)`

---

## 3. SQL Миграция (`supabase/migrations/20260802000003_sprint_2a_social_graph.sql`)

### 3.1. Триггер авто-создания владельца
```sql
CREATE OR REPLACE FUNCTION public.handle_circle_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.circle_members (circle_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'OWNER'::public.circle_role)
  ON CONFLICT (circle_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_circles_auto_owner
  AFTER INSERT ON public.circles
  FOR EACH ROW EXECUTE FUNCTION public.handle_circle_owner_member();
```

### 3.2. Функция проверки доступа `check_circle_access`
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
    JOIN public.circle_members cm_target ON cm_target.circle_id = ca.circle_id AND cm_target.user_id = v_owner_user_id
    JOIN public.circle_members cm_viewer ON cm_viewer.circle_id = ca.circle_id AND cm_viewer.user_id = auth.uid()
    WHERE ca.profile_id = p_profile_id
      AND (p_section IS NULL OR ca.section = p_section)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;
```

---

## 4. Список новых RLS политик

- **`public.circles`**:
  - `circles_select_policy`: Доступно участникам круга (`EXISTS` в `circle_members`).
  - `circles_insert_policy`: С обязательной проверкой `auth.uid() = owner_id`.
  - `circles_update_policy` & `circles_delete_policy`: Только для владельца `auth.uid() = owner_id`.
- **`public.circle_members`**:
  - `circle_members_select_policy`: Видимо только другим участникам этого же круга.
  - `circle_members_insert_policy` & `delete_policy`: Добавление самого себя по инвайту или удаление владельцем/собой.
- **`public.circle_accesses`**:
  - `circle_accesses_select_policy`: Доступно участникам круга.
  - `circle_accesses_insert_policy` & `delete_policy`: Только владелец `gift_profile`.

---

## 5. Deno Edge Function (`circle-invite`)

Файл `supabase/functions/circle-invite/index.ts`:
- **`generate`**: Создает криптографически случайный 10-значный Base62 код для круга (`crypto.getRandomValues`).
- **`validate`**: Возвращает информацию о круге для превью инвайта.
- **`join`**: Добавляет пользователя в `circle_members`. 
  - Если круг архивирован (`is_archived = true`), возвращает ошибку 400 и блокирует вступление.

---

## 6. Список экранов приложения

1. **`/circles`**: Список всех кругов пользователя с фильтром ролей («Создатель» / «Участник»), модальными окнами создания нового круга и ввода инвайт-кода.
2. **`/circles/create`**: Модальное окно создания круга (`CreateCircleModal`).
3. **`/circles/:id`**: Детальный экран круга (`CircleDetailsView`). Отображает список участников, роли, кнопку копирования кода приглашения и вызов матрицы доступа.
4. **`/profile/:id`**: Экран просмотра чужого Gift Profile (`MemberProfileView`). Отображает только те секции, к которым текущему пользователю выдан доступ через `can_view_profile`.

---

## 7. Подтверждение выполнения Definition of Done

- [x] Можно создать круг (владелец добавляется автоматически через триггер).
- [x] Можно сгенерировать Base62 код и пригласить человека.
- [x] Можно вступить в круг по коду приглашения.
- [x] Архивированные круги блокируют новые вступления, но сохраняют доступы.
- [x] Можно управлять участниками и исключать их.
- [x] Можно выдать или отозвать доступ к секциям профиля через `AccessMatrixModal`.
- [x] Просмотр чужого профиля (`/profile/:id`) фильтрует секции на уровне **PostgreSQL RLS**.
- [x] Проект компилируется без ошибок (`npm run typecheck` и `npm run build` за 3.16с).
- [x] 100% совместимость с бесплатными тарифами **Supabase Free Tier** и **Vercel**.
