# TECH_SPEC.md

## Цель

Telegram WebApp + Telegram Bot.

Бюджет по умолчанию: **0 рублей**.

Используем только:

- free-tier;
- open-source;
- self-hosted где возможно.

## Frontend

| Инструмент | Версия | Почему |
|------------|--------|--------|
| React | 19 | Современный стандарт React и совместимость с актуальной экосистемой |
| Vite | 7 | Максимально быстрая разработка и сборка WebApp |
| TypeScript | 5.9+ | Типобезопасность и надёжность кода |
| React Router | 7 | Современная маршрутизация |
| Tailwind CSS | 4 | Актуальная система стилей и дизайн-токены |
| shadcn/ui | Tailwind v4 registry | Контролируемые UI-компоненты без зависимости от готовых библиотек |
| Radix UI | latest | Доступные и стабильные примитивы интерфейса |
| Lucide React | latest | Лёгкие и современные SVG-иконки |
| Sonner | latest | Минималистичные уведомления |
| TanStack Query | 5 | Серверное состояние, кэширование и синхронизация с Supabase |
| React Hook Form | latest | Производительные формы с минимальными перерендерами |
| Zod | latest | Типобезопасная валидация данных и интеграция с формами |

Правило выбора библиотек: использовать только библиотеки, которые совместимы с React 19 и Tailwind CSS 4. Перед добавлением новой зависимости обязательно проверять официальную документацию и changelog за 2025-2026 годы.

## Backend

| Инструмент | Версия | Почему |
|------------|--------|--------|
| Node.js | 22 LTS | Стабильная серверная платформа |
| Supabase | latest | Бесплатный backend: PostgreSQL, Auth, Storage и Realtime |
| Supabase Edge Functions| latest| Серверная логика и обработка Telegram WebApp запросов |
| PostgreSQL | 16 | Основная БД |
| Supabase Realtime | latest | Обновление данных в реальном времени |
| Supabase Storage | latest | Бесплатное хранение изображений и файлов |
| Vercel Functions | latest | Serverless API и интеграция с Telegram Bot/WebApp |

## Telegram

- Telegram Bot API
- Telegram WebApp SDK

## Хранение файлов

Cloudflare R2 (S3-совместимое бесплатное хранилище).

## Деплой

### Frontend

Cloudflare Pages.

### Backend

Railway или Render (free tier).

### База данных

Supabase PostgreSQL (free tier).

## Что НЕ использовать

- Redux
- MobX
- Sass
- Styled Components
- Emotion
- Axios
- Moment.js
- Formik
- Jest для новых тестов (предпочтительно Vitest)

## Версионная политика

Всегда использовать последние стабильные версии.

Перед обновлением:

1. проверить changelog;
2. проверить breaking changes;
3. проверить совместимость.