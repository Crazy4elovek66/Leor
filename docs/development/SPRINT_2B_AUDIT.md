# SPRINT_2B_AUDIT.md — Аудит реализации Sprint 2B (Wishlist MVP / Gift Card)

Этот документ содержит полный технический и продуктовый аудит результатов разработки **Sprint 2B (Wishlist MVP / Gift Card)** проекта **Secret Circle (Leor)**.

---

## 1. Обзор Sprint 2B

В рамках Sprint 2B реализован MVP системы карточек желаний (Gift Cards):
- Вся логика построена вокруг объекта **Gift Card** с выверенной типографикой, фотографиями высочайшего качества и фирменным акцентом `#D8B4B0`.
- Каждая карточка динамически вычисляет размер одежды/обуви из `profile_sizes` с помощью чистой функции-хелпера `resolveWishSize()`.
- Изображения загружаются напрямую в публичный бакет **Supabase Storage** `wish-images`.
- Отображение чужих карточек на экране `/profile/:id` полностью контролируется функцией **PostgreSQL RLS** `can_view_profile(profile_id, 'WISHLIST')`.
- Сохранен строго продуктовый объем MVP: без ретро-функций, бронирования подарков (GiftReservation) и прочих функций будущих спринтов.

---

## 2. SQL Схема Таблицы `wishes`

```sql
CREATE TABLE IF NOT EXISTS public.wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CONSTRAINT chk_wishes_title_length CHECK (length(title) <= 120),
  description TEXT CONSTRAINT chk_wishes_description_length CHECK (length(description) <= 1000),
  brand TEXT CONSTRAINT chk_wishes_brand_length CHECK (length(brand) <= 80),
  image_url TEXT,
  link TEXT,
  price NUMERIC(12, 2) CONSTRAINT chk_wishes_price_positive CHECK (price >= 0.0),
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

---

## 3. Новые PostgreSQL ENUM Типы

- `public.wish_category`: `'TECH'`, `'BOOKS'`, `'CLOTHING'`, `'BEAUTY'`, `'HOME'`, `'HOBBY'`, `'FOOD'`, `'TRAVEL'`, `'EXPERIENCE'`, `'OTHER'`
- `public.wish_priority`: `'LOW'`, `'MEDIUM'`, `'HIGH'`
- `public.wish_status`: `'ACTIVE'`, `'ARCHIVED'`
- `public.wish_source`: `'MANUAL'`, `'LINK'`, `'IMPORT'`
- `public.wish_context`: `'BIRTHDAY'`, `'NEW_YEAR'`, `'ANNIVERSARY'`, `'JUST_WANT'`, `'SOMEDAY'`, `'OTHER'`

---

## 4. Список RLS Политик Таблицы `wishes`

- `wishes_select_policy` (`FOR SELECT`):
  Владелец может просматривать все свои желания (`auth.uid() = user_id`). Чужие желания видны исключительно если PostgreSQL функция `public.can_view_profile(gp.id, 'WISHLIST')` возвращает `true`.
- `wishes_insert_policy` (`FOR INSERT WITH CHECK`):
  Разрешено добавление желаний только от своего имени (`auth.uid() = user_id`).
- `wishes_update_policy` (`FOR UPDATE USING/WITH CHECK`):
  Модификация разрешена исключительно владельцу (`auth.uid() = user_id`).
- `wishes_delete_policy` (`FOR DELETE USING`):
  Удаление разрешено исключительно владельцу (`auth.uid() = user_id`).

---

## 5. Storage Структура `wish-images`

- **Бакет**: `wish-images` (публичный доступ для чтения).
- **Путь к файлу**: `{user_id}/{timestamp}_{random_hash}.{ext}`.
- **Права на загрузку**: Только авторизованные пользователи Supabase (`auth.uid() IS NOT NULL`).

---

## 6. Описание Интеграции `resolveWishSize`

Размеры пользователя **не дублируются** внутри объектов желаний `wishes`. 
Компонент `WishCard` принимает результат работы хелпера `resolveWishSize`:

```ts
export function resolveWishSize(
  category: WishCategory,
  sizes: ProfileSizeItem[],
  sizeOverride?: string | null
): string | null {
  if (sizeOverride && sizeOverride.trim().length > 0) {
    return sizeOverride.trim();
  }

  if (!sizes || sizes.length === 0) return null;

  if (category === 'CLOTHING') {
    const top = sizes.find((s) => s.category === 'CLOTHING_TOP')?.value;
    const bottom = sizes.find((s) => s.category === 'CLOTHING_BOTTOM')?.value;
    const shoes = sizes.find((s) => s.category === 'SHOES')?.value;

    const parts: string[] = [];
    if (top) parts.push(`Верх: ${top}`);
    if (bottom) parts.push(`Низ: ${bottom}`);
    if (shoes) parts.push(`Обувь: ${shoes}`);

    return parts.length > 0 ? parts.join(', ') : null;
  }

  if (category === 'BEAUTY' || category === 'OTHER') {
    const ring = sizes.find((s) => s.category === 'RING')?.value;
    const bracelet = sizes.find((s) => s.category === 'BRACELET')?.value;
    const necklace = sizes.find((s) => s.category === 'NECKLACE')?.value;

    const parts: string[] = [];
    if (ring) parts.push(`Кольцо: ${ring}`);
    if (bracelet) parts.push(`Браслет: ${bracelet}`);
    if (necklace) parts.push(`Цепочка: ${necklace}`);

    return parts.length > 0 ? parts.join(', ') : null;
  }

  return null;
}
```

---

## 7. Список Созданных и Измененных Файлов

### 7.1. Новые файлы
- `supabase/migrations/20260802000005_sprint_2b_wishlist.sql` — SQL миграция
- `src/features/wishlist/types.ts` — Доменные типы и словари категорий/приоритетов/контекстов
- `src/features/wishlist/utils/resolveWishSize.ts` — Хелпер связки категорий с `profile_sizes`
- `src/features/wishlist/hooks/useWishlist.ts` — Кастомный хук CRUD операций желаний и загрузки обложек
- `src/features/wishlist/hooks/useMemberWishlist.ts` — Хук загрузки чужого Wishlist под контролем RLS
- `src/features/wishlist/components/WishCard.tsx` — Компонент карточки Gift Card
- `src/features/wishlist/components/WishlistGrid.tsx` — Сетка карточек с сортировкой (Priority &rarr; CreatedAt DESC)
- `src/features/wishlist/components/CreateWishModal.tsx` — Модальное окно добавления/редактирования желания
- `src/features/wishlist/components/WishDetailsModal.tsx` — Модальное окно просмотра полных сведений и действия владельца
- `docs/development/PLAN_SPRINT_2B.md` — План реализации Sprint 2B
- `docs/development/SPRINT_2B_AUDIT.md` — Аудит результатов Sprint 2B

### 7.2. Модифицированные файлы
- `src/shared/types/database.types.ts` — Сгенерированные типы Supabase с таблицей `wishes` и ENUMs
- `src/features/profile/components/GiftProfileView.tsx` — Интеграция секции «Мой Wishlist» на главной карте профиля
- `src/features/circle/components/MemberProfileView.tsx` — Отображение секции желаний участника под RLS
- `docs/architecture/DATABASE_SCHEMA_v2.1_FROZEN.md` & `docs/product/PRODUCT_SPEC_v2.1_FROZEN.md` — Фиксация спецификаций Sprint 2B
- `docs/CHANGELOG.md` & `README.md` — Документирование версий и ссылок

---

## 8. Структура Проекта (Уровень 3)

```text
Leor/
├── docs/
│   ├── architecture/
│   │   ├── ARCHITECTURE.md
│   │   └── DATABASE_SCHEMA_v2.1_FROZEN.md
│   ├── development/
│   │   ├── AGENTS.md
│   │   ├── FOUNDATION_FREEZE.md
│   │   ├── IMPLEMENTATION_PLAN.md
│   │   ├── PLAN_SPRINT_2A.md
│   │   ├── PLAN_SPRINT_2B.md
│   │   ├── SECURITY_CHECKLIST.md
│   │   ├── SPRINT_1.1_AUDIT.md
│   │   ├── SPRINT_1.2_AUDIT.md
│   │   ├── SPRINT_1_AUDIT.md
│   │   ├── SPRINT_2A_1_AUDIT.md
│   │   ├── SPRINT_2A_AUDIT.md
│   │   ├── SPRINT_2B_AUDIT.md
│   │   └── TECH_SPEC.md
│   ├── product/
│   │   ├── PRODUCT_SPEC_v2.1_FROZEN.md
│   │   └── TASKS.md
│   ├── design/
│   │   └── DESIGN_GUIDELINES.md
│   └── CHANGELOG.md
├── src/
│   ├── api/
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   ├── circle/
│   │   ├── profile/
│   │   └── wishlist/
│   ├── layouts/
│   ├── lib/
│   ├── router/
│   └── shared/
├── supabase/
│   ├── functions/
│   └── migrations/
├── public/
├── package.json
├── README.md
├── tsconfig.json
├── vite.config.ts
└── vercel.json
```

---

## 9. Подтверждение Совместимости с Supabase Free Tier & Vercel

- **Supabase Free Tier**: Таблица `wishes` использует стандартный PostgreSQL B-Tree индекс и 5 легких ENUM типов. Бакет `wish-images` использует стандартный бесплатный лимит Storage (до 1 ГБ). RLS функции выполняются бессерверно на стороне СУБД.
- **Vercel**: Полный клиентский бандл строит статическое SPA с реактивными компонентами (`built in 3.32s`). 0 ошибок типа в `tsc --noEmit`.
