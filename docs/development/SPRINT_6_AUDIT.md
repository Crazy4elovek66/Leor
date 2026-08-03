# SPRINT_6_AUDIT.md — Аудит реализации Sprint 6 (Public Profiles & Share Layer)

Этот документ содержит полный технический и архитектурный аудит результатов разработки **Sprint 6 (Public Profiles & Share Layer)** проекта **Secret Circle (Leor)**.

---

## 1. Обзор Sprint 6

В рамках Sprint 6 построен безопасный слой публичного просмотра **Gift Profile** по ссылке:
- **Криптографические Токены**: Уникальные токены Base62 длиной не менее 24 символов в таблице `public_profile_shares`.
- **Раздельные Переключатели Секций**: Независимый выбор видимости для `BASIC_INFO`, `INTERESTS`, `WISHLIST` и `SIZES`.
- **Изоляция Безопасности**: Публичный просмотр по ссылке исключает раскрытие внутренних UUID, состава кругов, статусов бронирований и внутренних форматов Taste Graph.
- **Бессессионный Просмотр**: Экран `/share/:token` доступен без авторизации и Telegram WebApp контекста.
- **OpenGraph & Мета-теги**: Автоматическая динамическая подстановка заголовка, описания и предпросмотра для мессенджеров (Telegram, WhatsApp и др.).
- **Сохранение Фундамента**: Действующие RLS политики и `CircleAccess` не изменялись.

---

## 2. SQL Схема и Процедуры (`20260806000001_sprint_6_public_share.sql`)

```sql
CREATE TABLE IF NOT EXISTS public.public_profile_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.gift_profiles(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE CONSTRAINT chk_share_token_len CHECK (length(share_token) >= 24),
  is_active BOOLEAN NOT NULL DEFAULT true,
  show_basic_info BOOLEAN NOT NULL DEFAULT true,
  show_interests BOOLEAN NOT NULL DEFAULT true,
  show_wishlist BOOLEAN NOT NULL DEFAULT true,
  show_sizes BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### PL/pgSQL RPC Функции (`SECURITY DEFINER SET search_path = public`):
- `create_public_share(p_profile_id UUID)` &rarr; Создает или активирует публичную ссылку владельца.
- `rotate_public_share_token(p_profile_id UUID)` &rarr; Перегенерирует токен (старая ссылка мгновенно аннулируется).
- `disable_public_share(p_profile_id UUID)` &rarr; Переводит `is_active` в `false`.
- `update_public_share_visibility(...)` &rarr; Обновляет переключатели доступности секций.
- `get_public_profile(p_token TEXT)` &rarr; Безопасный анонимный RPC. Для недействительных ссылок возвращает `found: false` (404).

---

## 3. Фронтенд Модуль `src/features/share/`

```text
src/features/share/
├── components/
│   ├── PublicProfileView.tsx # Экран анонимного просмотра (/share/:token)
│   └── ShareSettings.tsx     # Управление публичной ссылкой в профиле
├── hooks/
│   ├── usePublicProfile.ts   # Хук анонимного вызова RPC get_public_profile
│   └── useShareSettings.ts   # Управление настройками и токенами владельца
└── types.ts                  # Доменные типы
```

---

## 4. Выполнение Definition of Done

- [x] Создана таблица `public_profile_shares` с токенами Base62 (>= 24 символа).
- [x] Реализованы переключатели секций `BASIC_INFO`, `INTERESTS`, `WISHLIST`, `SIZES`.
- [x] Реализованы RPC `create_public_share`, `rotate_public_share_token`, `disable_public_share`, `get_public_profile`.
- [x] Экран `/share/:token` функционирует без требований авторизации.
- [x] В публичном ответе отсутствуют внутренние UUID, круги, бронирования или данные Taste Graph.
- [x] Настроены OpenGraph мета-теги для Telegram preview.
- [x] `npm run typecheck` — 0 ошибок.
- [x] `npm run build` — Успешная сборка за 3.00с.
- [x] Создан отчёт `SPRINT_6_AUDIT.md`.
