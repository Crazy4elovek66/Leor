# PLAN_SPRINT_2B.md — Обновленный План Реализации Sprint 2B (Wishlist MVP / Gift Card)

Документ обновлён и зафиксирован с учетом 8 уточняющих продуктовых и архитектурных правок.

---

## 1. Обзор Sprint 2B

### Главная цель
Реализовать MVP системы желаний (Wishlist), построенной вокруг объекта **Gift Card**, интегрированной с картой **Gift Profile** и **CircleAccess**.

> ⚠️ **Важное правило архитектуры**: 
> 1. Wishlist не дублирует размеры пользователя. Использовать хелпер `resolveWishSize(category, profile_sizes)` вне карточки.
> 2. Отдельная вкладка Wishlist в `BottomNavigation` **не добавляется**. Wishlist доступен внутри карт Gift Profile (`/profile` и `/profile/:id`).
> 3. Контекст карточки передается в виде PostgreSQL ENUM `wish_context` (`BIRTHDAY`, `NEW_YEAR`, `ANNIVERSARY`, `JUST_WANT`, `SOMEDAY`, `OTHER`). Русские названия отображаются строго на фронтенде.

---

## 2. Архитектура Базы Данных (Миграция `20260802000005_sprint_2b_wishlist.sql`)

### 2.1. PostgreSQL ENUM Типы
```sql
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wish_category') THEN
    CREATE TYPE public.wish_category AS ENUM ('TECH', 'BOOKS', 'CLOTHING', 'BEAUTY', 'HOME', 'HOBBY', 'FOOD', 'TRAVEL', 'EXPERIENCE', 'OTHER');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wish_priority') THEN
    CREATE TYPE public.wish_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wish_status') THEN
    CREATE TYPE public.wish_status AS ENUM ('ACTIVE', 'ARCHIVED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wish_source') THEN
    CREATE TYPE public.wish_source AS ENUM ('MANUAL', 'LINK', 'IMPORT');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wish_context') THEN
    CREATE TYPE public.wish_context AS ENUM ('BIRTHDAY', 'NEW_YEAR', 'ANNIVERSARY', 'JUST_WANT', 'SOMEDAY', 'OTHER');
  END IF;
END $$;
```

### 2.2. Таблица `public.wishes`
```sql
CREATE TABLE IF NOT EXISTS public.wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CONSTRAINT chk_wishes_title_length CHECK (length(title) <= 120),
  description TEXT CONSTRAINT chk_wishes_description_length CHECK (length(description) <= 1000),
  brand TEXT CONSTRAINT chk_wishes_brand_length CHECK (length(brand) <= 80),
  image_url TEXT,
  link TEXT,
  price NUMERIC(12, 2) CONSTRAINT chk_wishes_price_positive CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'RUB',
  category public.wish_category NOT NULL DEFAULT 'OTHER'::public.wish_category,
  priority public.wish_priority NOT NULL DEFAULT 'MEDIUM'::public.wish_priority,
  visibility public.visibility_level NOT NULL DEFAULT 'CIRCLE'::public.visibility_level,
  status public.wish_status NOT NULL DEFAULT 'ACTIVE'::public.wish_status,
  source_type public.wish_source NOT NULL DEFAULT 'MANUAL'::public.wish_source,
  context public.wish_context NOT NULL DEFAULT 'JUST_WANT'::public.wish_context,
  is_surprise_friendly BOOLEAN NOT NULL DEFAULT true,
  size_override TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.3. Триггер `updated_at` и Индексы
```sql
CREATE TRIGGER trg_wishes_set_updated_at
  BEFORE UPDATE ON public.wishes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_wishes_user ON public.wishes (user_id);
CREATE INDEX IF NOT EXISTS idx_wishes_status ON public.wishes (status);
CREATE INDEX IF NOT EXISTS idx_wishes_priority ON public.wishes (priority);
```

### 2.4. RLS Политики Таблицы `wishes`
```sql
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishes_select_policy" ON public.wishes
  FOR SELECT USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.gift_profiles gp
      WHERE gp.user_id = wishes.user_id
        AND public.can_view_profile(gp.id, 'WISHLIST'::public.profile_section)
    )
  );

CREATE POLICY "wishes_insert_policy" ON public.wishes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishes_update_policy" ON public.wishes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishes_delete_policy" ON public.wishes
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 3. Фронтенд и Логика Хелперов

### 3.1. Хелпер `resolveWishSize` (`src/features/wishlist/utils/resolveWishSize.ts`)
```ts
export function resolveWishSize(
  category: WishCategory,
  sizes: ProfileSizeItem[],
  sizeOverride?: string | null
): string | null {
  if (sizeOverride && sizeOverride.trim()) {
    return sizeOverride.trim();
  }

  if (category === 'CLOTHING') {
    const top = sizes.find((s) => s.category === 'CLOTHING_TOP')?.value;
    const bottom = sizes.find((s) => s.category === 'CLOTHING_BOTTOM')?.value;
    if (top && bottom) return `Верх: ${top}, Низ: ${bottom}`;
    if (top) return `Размер: ${top}`;
    if (bottom) return `Размер: ${bottom}`;
  }

  if (category === 'BEAUTY' || category === 'OTHER') {
    const shoes = sizes.find((s) => s.category === 'SHOES')?.value;
    if (shoes) return `Обувь: ${shoes}`;
    const ring = sizes.find((s) => s.category === 'RING')?.value;
    if (ring) return `Кольцо: ${ring}`;
  }

  return null;
}
```

### 3.2. Сортировка `WishlistGrid`
1. Приоритет `HIGH` (1) &rarr; `MEDIUM` (2) &rarr; `LOW` (3).
2. Вторичная сортировка: `created_at DESC`.

---

## 4. Ожидание Утверждения

Ожидаю вашего решения по обновлённому плану `PLAN_SPRINT_2B.md` перед стартом реализации!
