# PLAN_SPRINT_6.md — План Реализации Sprint 6 (Public Profiles & Share Layer)

Документ описывает технический план реализации **Sprint 6 (Public Profiles & Share Layer)** проекта **Secret Circle (Leor)**.

---

## 1. Обзор Sprint 6

### Главная цель
Создать безопасный слой публичного просмотра Gift Profile по уникальной ссылке без нарушения архитектуры доступа `CircleAccess` и без изменения действующих политик RLS.

---

## 2. База Данных и SQL Миграция (`supabase/migrations/20260806000001_sprint_6_public_share.sql`)

### 2.1. Таблица `public.public_profile_shares`
- `id`: UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
- `profile_id`: UUID UNIQUE NOT NULL REFERENCES `public.gift_profiles(id)` ON DELETE CASCADE
- `share_token`: TEXT UNIQUE NOT NULL (Base62, 24+ символа)
- `is_active`: BOOLEAN DEFAULT true
- `show_basic_info`: BOOLEAN DEFAULT true
- `show_interests`: BOOLEAN DEFAULT true
- `show_wishlist`: BOOLEAN DEFAULT true
- `show_sizes`: BOOLEAN DEFAULT false
- `created_at`, `updated_at`

### 2.2. PL/pgSQL Функции (`SECURITY DEFINER SET search_path = public`)
- `generate_share_token()`: Генерация 24-символьного криптографически стойкого Base62 токена.
- `create_public_share(p_profile_id UUID)`
- `rotate_public_share_token(p_profile_id UUID)`
- `disable_public_share(p_profile_id UUID)`
- `update_public_share_visibility(...)`
- `get_public_profile(p_token TEXT)`: Функция без требований к аутентификации. Возвращает открытые данные профиля и активные желания в зависимости от переключателей секций. Возвращает исключение или пустой отклик для неактивных/удаленных ссылок (404).

---

## 3. Фронтенд Модуль `src/features/share/`

- `types.ts`: Интерфейсы `PublicShareConfig`, `PublicProfileData`.
- `hooks/useShareSettings.ts`: Управление ссылкой на странице своего профиля.
- `hooks/usePublicProfile.ts`: Загрузка открытого профиля по токену без авторизации.
- `components/PublicProfileView.tsx`: Публичный экран по адресу `/share/:token` с OpenGraph тегами и анонимным просмотром.
- `components/ShareSettings.tsx` & `ShareLinkCard.tsx`: Панель управления ссылкой в `/profile`.

---

## 4. План Выполнения

1. SQL миграция `20260806000001_sprint_6_public_share.sql`
2. Обновление `database.types.ts`
3. Создание фронтенд модуля `src/features/share/`
4. Настройка публичного маршрута `/share/:token` в `AppRouter.tsx`
5. Встраивание `ShareSettings` в `/profile` (`GiftProfileView.tsx`)
6. Проверка `npm run typecheck` и `npm run build`
7. Создание отчёта `docs/development/SPRINT_6_AUDIT.md`
