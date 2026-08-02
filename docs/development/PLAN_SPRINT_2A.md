# PLAN_SPRINT_2A.md — План Реализации Sprint 2A (Social Graph)

Документ зафиксирован и утвержден с учетом 9 обязательных архитектурных правок.

---

## 1. Обзор Sprint 2A

### Главная цель
Реализовать социальный граф Leor: создание кругов (Circles), авто-добавление владельца, бессерверные инвайты, управление участниками, матрицу секционного доступа к Gift Profile и просмотр чужих карт профиля под защитой PostgreSQL RLS.

> ⚠️ **Важно**: В рамках Sprint 2A **Wishlist не реализуется ни в каком виде**.

---

## 2. Архитектура Базы Данных (Миграция `20260802000003_sprint_2a_social_graph.sql`)

### 2.1. PostgreSQL ENUM Типы
```sql
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'circle_role') THEN
    CREATE TYPE public.circle_role AS ENUM ('OWNER', 'MEMBER');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_section') THEN
    CREATE TYPE public.profile_section AS ENUM ('BASIC_INFO', 'INTERESTS', 'SIZES', 'WISHLIST', 'MEMORIES');
  END IF;
END $$;
```

### 2.2. Таблицы в `snake_case`

#### Таблица `circles`
```sql
CREATE TABLE IF NOT EXISTS public.circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CONSTRAINT chk_circles_name_length CHECK (length(name) <= 100),
  avatar_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Таблица `circle_members`
```sql
CREATE TABLE IF NOT EXISTS public.circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.circle_role NOT NULL DEFAULT 'MEMBER'::public.circle_role,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_circle_members_circle_user UNIQUE (circle_id, user_id)
);
```

#### Таблица `circle_accesses`
```sql
CREATE TABLE IF NOT EXISTS public.circle_accesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.gift_profiles(id) ON DELETE CASCADE,
  section public.profile_section NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_circle_accesses_circle_profile_section UNIQUE (circle_id, profile_id, section)
);
```

### 2.3. Авто-создание Владельца Круга (Trigger)
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

### 2.4. Требуемые Индексы
```sql
CREATE INDEX IF NOT EXISTS idx_circle_members_user ON public.circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON public.circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_accesses_profile ON public.circle_accesses(profile_id);
CREATE INDEX IF NOT EXISTS idx_circle_accesses_circle_section ON public.circle_accesses(circle_id, section);
CREATE INDEX IF NOT EXISTS idx_circles_owner ON public.circles(owner_id);
```

### 2.5. Функция `check_circle_access` и `can_view_profile` через `public.profile_section`

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

CREATE OR REPLACE FUNCTION public.can_view_profile(
  p_profile_id UUID,
  p_section public.profile_section DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_owner_user_id UUID;
BEGIN
  SELECT user_id INTO v_owner_user_id FROM public.gift_profiles WHERE id = p_profile_id;

  IF v_owner_user_id IS NOT NULL AND v_owner_user_id = auth.uid() THEN
    RETURN TRUE;
  END IF;

  IF public.check_circle_access(p_profile_id, p_section) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;
```

---

## 3. Правила и Логика Edge Function (`circle-invite`)

1. **Правила `invite_code`**:
   - Длина: 10–12 символов.
   - Алфавит: Base62 (`[a-zA-Z0-9]`).
   - Криптографически случайный (`crypto.getRandomValues`).
2. **Поведение Архивированного Круга**:
   - Новые вступления **запрещены** (возврат 400 "Круг архивирован").
   - Доступы для текущих участников **сохраняются**.
   - Данные не удаляются.

---

## 4. Фронтенд Компоненты & Роуты

- `/circles` &rarr; Список кругов пользователя и кнопка «Вступить по коду».
- `/circles/create` &rarr; Форма создания круга.
- `/circles/:id` &rarr; Участники круга, управление ролями, ссылка-приглашение и кнопка настроек доступа к профилю (`AccessMatrixModal`).
- `/profile/:id` &rarr; Просмотр чужой карты Gift Profile с фильтрацией секций на уровне PostgreSQL RLS.
