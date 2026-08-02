# IMPLEMENTATION_PLAN.md — Secret Circle (Leor) [Supabase-First Architecture]

Документ утвержден и актуализирован с учетом требований к **бесплатной инфраструктуре (Supabase Free Tier)**:
- [`AGENTS.md`](./AGENTS.md)
- [`ARCHITECTURE.md`](../architecture/ARCHITECTURE.md)
- [`TECH_SPEC.md`](./TECH_SPEC.md)
- [`DESIGN_GUIDELINES.md`](../design/DESIGN_GUIDELINES.md)
- [`SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md)
- [`TASKS.md`](../product/TASKS.md)
- [`PRODUCT_SPEC_v2.1_FROZEN.md`](../product/PRODUCT_SPEC_v2.1_FROZEN.md)
- [`DATABASE_SCHEMA_v2.1_FROZEN.md`](../architecture/DATABASE_SCHEMA_v2.1_FROZEN.md)

---

## 1. Структура проекта (Project Structure)

Вся инфраструктура проекта строится на **Supabase-first** модели без использования Prisma, без NestJS, без Redis, без BullMQ и без отдельного бэкенд-сервера.

```text
Leor/
├── src/                      # Frontend (React 19 + Vite 7 + Tailwind CSS v4 + Supabase JS Client)
│   ├── app/                  # Инициализация приложения, глобальные стили и точки входа
│   ├── providers/            # SupabaseProvider, TelegramSDKProvider, QueryClientProvider
│   ├── router/               # React Router 7 маршрутизация
│   ├── layouts/              # RootLayout, AppLayout, AuthLayout (Safe Area handling)
│   ├── features/             # Автономные фичи (Только фичи Sprint 1!)
│   │   ├── auth/             # Авторизация Telegram WebApp + Supabase Auth Session
│   │   └── profile/          # Gift Profile, Базовая информация, Размеры, Интересы
│   ├── components/           # Переиспользуемые UI компоненты
│   │   ├── ui/               # shadcn/ui компоненты (Tailwind v4 registry)
│   │   └── common/           # BottomNav, Header, EmptyState, CompletenessWidget, SafeContainers
│   ├── shared/               # Типы TypeScript (включая сгенерированные database.types.ts)
│   ├── api/                  # Supabase JS Client (`@supabase/supabase-js`) & Edge Function helpers
│   ├── lib/                  # Telegram WebApp SDK helpers, utils (cn, formatters)
│   ├── hooks/                # Общие React hooks (useSupabase, useTelegram)
│   ├── styles/               # Глобальные токены CSS (#0F0F10, #17171A, #D8B4B0, CSS Transitions)
│   └── assets/               # Иконки, плейсхолдеры
│
├── supabase/                 # Supabase Infrastructure & Serverless
│   ├── functions/            # Supabase Edge Functions (Deno / TypeScript)
│   │   └── telegram-auth/    # Проверка HMAC initData Telegram, регистрация/вход в Supabase Auth
│   ├── migrations/           # SQL миграции PostgreSQL (DDL схемы v2.1 в snake_case, RLS политики)
│   └── seed.sql              # Сиды для разработки
│
└── docs/                     # Продуктовая и техническая документация
    ├── architecture/
    │   ├── ARCHITECTURE.md
    │   └── DATABASE_SCHEMA_v2.1_FROZEN.md
    ├── product/
    │   ├── PRODUCT_SPEC_v2.1_FROZEN.md
    │   └── TASKS.md
    ├── development/
    │   ├── AGENTS.md
    │   ├── TECH_SPEC.md
    │   ├── SECURITY_CHECKLIST.md
    │   └── IMPLEMENTATION_PLAN.md
    ├── design/
    │   └── DESIGN_GUIDELINES.md
    └── CHANGELOG.md
```

---

## 2. Переменные окружения (Environment Variables)

Строгое разделение публичных и приватных переменных окружения:

### Фронтенд (`.env.example` / `.env.local` — только с префиксом `VITE_`):
- `VITE_SUPABASE_URL` — публичный URL инстанса Supabase.
- `VITE_SUPABASE_ANON_KEY` — публичный анонимный ключ Supabase (безопасен для клиента, так как доступ ограничивается RLS).
- `VITE_TELEGRAM_BOT_NAME` — юзернейм Telegram бота (`iLeorBot`).

### Supabase Edge Functions (Secrets — на стороне Supabase Deno runtime):
- `TELEGRAM_BOT_TOKEN` — секретный токен бота Telegram. **Строго запрещено** передавать или использовать на клиенте/фронтенде.
- `SUPABASE_SERVICE_ROLE_KEY` — сервис-ключ для создания/управления Supabase Auth пользователями в `telegram-auth` Edge Function.

---

## 3. Структура фронтенда (Frontend Structure)

Фронтенд разрабатывается с использованием **React 19**, **Vite 7**, **TypeScript 5.9+**, **React Router 7**, **Tailwind CSS v4**, **`@supabase/supabase-js`** и **shadcn/ui**.

### Принципы фронтенд-архитектуры:
1. **No Prisma / Supabase Type Gen**: ORM Prisma полностью отсутствует. Работа с БД происходит через `@supabase/supabase-js` со строгими типами `database.types.ts`, генерируемыми Supabase CLI из миграций.
2. **Strict Sprint 1 Scope**: В `src/features/` создаются **только** модули `auth/` и `profile/`. Модули `circle/`, `wishlist/`, `gifts/` отложены до соответствующих спринтов.
3. **No Framer Motion in Sprint 1**: В Sprint 1 плавная анимация переходов, появление карточек и модальных окон реализуются через стандартные CSS-переходы (`transition-all`, `duration-200`, `ease-out`).
4. **Дизайн-система & Цветовая палитра** (`DESIGN_GUIDELINES.md`):
   - **Main Background**: `#0F0F10`
   - **Card Background**: `#17171A`
   - **Elevated Card**: `#1D1D21`
   - **Borders**: `#26262B` (тонкие 1px линии)
   - **Text Primary**: `#F5F5F7`
   - **Text Secondary**: `#A1A1AA`
   - **Text Tertiary**: `#71717A`
   - **Accent Dusty Rose**: `#D8B4B0` (кнопки, активные состояния, прогресс)
   - **Secondary Accent**: `#E7D7C9`
   - **Typography**: Inter (основной) + Manrope (акцентный/заголовки). Tabular nums для чисел.

---

## 4. Структура бэкенда (Backend Infrastructure & Supabase Free Tier)

Вся серверная логика строится на **Supabase Free Tier (0 рублей)**:

1. **Supabase PostgreSQL 16**:
   - Хранение всех данных в таблицах с именованием `snake_case`.
2. **Supabase Auth**:
   - Пользовательский вход через Edge Function `telegram-auth`, проверяющую `initData` HMAC и возвращающую пользовательский JWT токен.
3. **Supabase Edge Functions**:
   - Deno / TypeScript функция `telegram-auth` проверяет подлинность данных Telegram WebApp.

---

## 5. Структура базы данных (Database Schema & `snake_case`)

Все таблицы и колонки схемы v2.1 создаются в формате **`snake_case`** через SQL миграцию в `supabase/migrations/`:

### Основные таблицы:
- **`users`**: `id` (uuid, primary key), `telegram_id` (bigint, unique), `username` (text), `first_name` (text), `last_name` (text), `avatar_url` (text), `created_at`, `updated_at`.
- **`gift_profiles`**: `id` (uuid, primary key), `user_id` (uuid, unique, ref `users.id`), `bio` (text), `birth_date` (date), `city` (text), `created_at`, `updated_at`.
- **`profile_sizes`**: `id` (uuid, primary key), `profile_id` (ref `gift_profiles.id`), `category` (enum `size_category`), `value` (text), `visibility` (enum `visibility_level`).
- **`taste_items`**: `id` (uuid, primary key), `profile_id` (ref `gift_profiles.id`), `category` (enum `taste_category`), `title` (text), `weight` (float, default 1.0), `created_at`, `updated_at`.
- **`current_focuses`**: `id` (uuid, primary key), `profile_id` (ref `gift_profiles.id`), `title` (text), `is_active` (boolean, default true), `created_at`.
- **`anti_gift_preferences`**: `id` (uuid, primary key), `profile_id` (ref `gift_profiles.id`), `title` (text).
- **`circles`**: `id`, `name`, `avatar_url`, `owner_id`, `invite_code`, `is_archived`, `created_at`, `updated_at`.
- **`circle_members`**: `id`, `circle_id`, `user_id`, `role`, `joined_at`.
- **`circle_accesses`**: `id`, `circle_id`, `profile_id`, `section`.
- **`wishes`**: `id`, `user_id`, `title`, `description`, `image_url`, `link`, `price`, `currency`, `type`, `category`, `priority`, `visibility`, `status`, `context`, `size_override`, `created_at`, `updated_at`.
- **`gift_reservations`**: `id`, `wish_id`, `reserved_by_id`, `status`, `reserved_at`, `confirmed_at`, `cancelled_at`, `expires_at`.

### Row Level Security (RLS):
- RLS включен на всех таблицах.
- Пользователь имеет доступ на чтение и запись собственных данных (`auth.uid() = id` или `auth.uid() = user_id`).

---

## 6. Последовательность реализации Sprint 1 (Sprint 1 Roadmap)

Объем **Sprint 1** строго ограничен:
1. **Telegram авторизация** (`initData` validation via Edge Function -> Supabase Session).
2. **Базовая информация профиля** (имя, фото, био, дата рождения, город).
3. **Gift Profile** (инициализация подарочной карты пользователя).
4. **Интересы** (выбор 3–5 интересов из `taste_category`).
5. **Размеры** (ввод размеров одежды, обуви, колец, браслетов в `profile_sizes`).

### Пошаговый план выполнения Sprint 1:

1. **Шаг 1: Инициализация Vite + React 19 + Tailwind v4 + Supabase CLI**:
   - Создание структуры проекта: `src/` (`features/auth`, `features/profile`), `supabase/`, `docs/`.
   - Инициализация `supabase/migrations/20260802000000_init_schema.sql` со всеми таблицами в `snake_case` и RLS.
   - Генерация TypeScript типов БД через Supabase CLI в `src/shared/types/database.types.ts`.
2. **Шаг 2: Edge Function Telegram Auth**:
   - Написание `supabase/functions/telegram-auth/index.ts` на Deno:
     - Валидация HMAC-SHA256 подписи `initData` от Telegram WebApp с помощью `TELEGRAM_BOT_TOKEN`.
     - Создание/обновление пользователя в `public.users` и получение JWT токена Supabase Auth.
3. **Шаг 3: Авторизация и Онбординг на фронтенде**:
   - `SupabaseProvider` и `useTelegramAuth` хук.
   - Слайды онбординга (3 карточки с CSS-переходами).
4. **Шаг 4: Форма базовой информации профиля**:
   - Первичное создание профиля: ввод имени, аватара, био, даты рождения, города.
   - Сохранение в `public.users` и `public.gift_profiles`.
5. **Шаг 5: Выбор интересов (`taste_items`)**:
   - `InterestsGrid` компонент для выбора 3–5 интересов из `taste_category`.
   - Запись в `public.taste_items`.
6. **Шаг 6: Ввод размеров (`profile_sizes`)**:
   - `SizesSection` компонент для ввода размеров одежды, обуви и украшений.
   - Запись в `public.profile_sizes`.
7. **Шаг 7: Экран Gift Profile & Прогресс заполнения**:
   - Просмотр личной карты пользователя (`/profile`) с виджетом заполненности профиля (`CompletenessWidget`).
8. **Шаг 8: E2E Верификация Sprint 1**:
   - Проверка связки: Telegram auth -> онбординг -> ввод данных -> интересы -> размеры -> карточка профиля.

---

## 7. Список экранов Sprint 1 (Screen List)

1. **`/onboarding`**: 3 слайда знакомства с продуктом («Подарки начинаются с понимания», «Создайте свою карту», «Только для близких»).
2. **`/auth`**: Экран инициализации Telegram Auth & Supabase сессии.
3. **`/profile/setup`**: Экран первичного заполнения информации (Имя, Фото, Био, Дата рождения, Город).
4. **`/profile/interests-setup`**: Выбор первых 3–5 интересов из категории `taste_category`.
5. **`/profile/sizes-setup`**: Экран ввода размеров (Одежда, Обувь, Украшения).
6. **`/profile` (Главный экран Sprint 1 — Мой Gift Profile)**: Просмотр собственной личной карты (Базовые данные, Интересы, Размеры, Виджет заполненности профиля).
7. **`/profile/edit`**: Редактирование био, города, даты рождения, размеров и интересов.

---

## 8. Список API (Supabase Client & Edge Functions)

### 8.1. Edge Functions (`supabase/functions/`)
- `POST /functions/v1/telegram-auth`: Принимает `initData`, проверяет HMAC подпись `TELEGRAM_BOT_TOKEN`, регистрирует/авторизует пользователя, возвращает Supabase Auth JWT.

### 8.2. Direct Supabase Database Operations (через `@supabase/supabase-js`)
- **`users` & `gift_profiles`**:
  - `supabase.from('users').select('*').eq('id', userId).single()`
  - `supabase.from('users').update({ first_name, last_name, avatar_url }).eq('id', userId)`
  - `supabase.from('gift_profiles').select('*').eq('user_id', userId).single()`
  - `supabase.from('gift_profiles').upsert({ user_id, bio, birth_date, city })`
- **`taste_items`**:
  - `supabase.from('taste_items').select('*').eq('profile_id', profileId)`
  - `supabase.from('taste_items').insert([{ profile_id, category, title }])`
  - `supabase.from('taste_items').delete().eq('id', interestId)`
- **`profile_sizes`**:
  - `supabase.from('profile_sizes').select('*').eq('profile_id', profileId)`
  - `supabase.from('profile_sizes').upsert([{ profile_id, category, value, visibility }])`
  - `supabase.from('profile_sizes').delete().eq('id', sizeId)`

---

## 9. Список компонентов Sprint 1 (Component List)

### 9.1. UI Components (`src/components/ui/` - shadcn/ui + Tailwind v4)
- `Button` (Primary `#D8B4B0`, Secondary, Ghost, height 52px, radius 16px).
- `Card` (Background `#17171A`, Elevated `#1D1D21`, Border `#26262B`, radius 20–24px).
- `Input` / `Textarea` (Тёмная система ввода).
- `Dialog` / `Sheet` (Модальные окна).
- `Badge` (Пыльно-розовые плашки категорий).
- `Skeleton` (Skeleton-загрузчики).
- `Avatar` (User аватары).
- `Progress` (Прогресс заполнения профиля).
- `Toast` (Sonner).

### 9.2. Common Components (`src/components/common/`)
- `Header`: Верхняя панель.
- `TelegramSafeContainer`: Контейнер с безопасными отступами Telegram (`env(safe-area-inset-top)` / `bottom`).
- `EmptyState`: Пустые состояния.
- `CompletenessWidget`: Виджет процента заполненности профиля.

### 9.3. Feature Components Sprint 1 (`src/features/`)
- **`auth/`**:
  - `OnboardingCarousel`: Слайдер из 3 карточек (CSS transition).
  - `TelegramAuthGuard`: Проверка Telegram авторизации.
- **`profile/`**:
  - `GiftProfileCard`: Карточка профиля.
  - `BasicInfoForm`: Форма ввода имени, био, даты рождения, города.
  - `InterestsGrid`: Выбор и отображение интересов.
  - `SizesSection`: Сетка размеров одежды, обуви и украшений.

---

## 10. Потенциальные риски (Potential Risks)

1. **Безопасность HMAC подписи**: Использование токена бота только внутри Edge Function (`TELEGRAM_BOT_TOKEN`), клиент никогда не имеет доступа к секретам.
2. **Лимиты Supabase Free Tier**: Эффективные таблицы `snake_case`, отсутствие лишних абстракций, прямое использование RLS.
3. **Безопасность RLS**: Все таблицы по умолчанию закрыты, доступ на чтение/запись открывается только для авторизованного владельца (`auth.uid()`).

---

### Статус: Реализованы Sprint 1 (Foundation) и Sprint 1.1 (Hardening)

---

## 11. Sprint 1.1 (Hardening) — Укрепление фундамента

### 11.1. PostgreSQL ENUM Types
- `visibility_level`: `'PRIVATE'`, `'CIRCLE'`, `'SELECTED_CIRCLES'`, `'PUBLIC'`
- `size_category`: `'CLOTHING_TOP'`, `'CLOTHING_BOTTOM'`, `'SHOES'`, `'RING'`, `'BRACELET'`, `'NECKLACE'`
- `taste_category`: `'MOVIES'`, `'BOOKS'`, `'GAMES'`, `'MUSIC'`, `'TRAVEL'`, `'STYLE'`, `'HOME'`, `'FOOD'`, `'SPORT'`, `'HOBBY'`, `'BRANDS'`

### 11.2. CHECK Constraints
- `length(bio) <= 500` в `gift_profiles`
- `length(city) <= 100` в `gift_profiles`
- `length(value) <= 100` в `profile_sizes`
- `weight > 0.0` в `taste_items`

### 11.3. updated_at Triggers & PL/pgSQL Functions
- `set_updated_at()` триггерная функция для автоматического обновления `updated_at`.
- `can_view_profile(p_profile_id UUID)` RLS функция фундамента для системы Кругов (Circle Access).
- `calculate_profile_completeness(p_profile_id UUID)` функция прямого расчета процента заполненности профиля в базе данных.

### 11.4. Telegram Auth Security
- `auth_date` проверкa replay-атак (максимальный TTL = 86400 с).
- Защита `TELEGRAM_BOT_TOKEN` — используется исключительно в бессерверных Edge Functions на Deno.
