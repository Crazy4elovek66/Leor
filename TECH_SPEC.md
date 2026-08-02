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
| React | 19 | Современный стандарт React |
| Vite | 7 | Максимально быстрая разработка |
| TypeScript | 5.9+ | Типобезопасность |
| React Router | 7 | Современный роутинг |
| Tailwind CSS | 4 | Актуальная система стилей |
| shadcn/ui | Tailwind v4 registry | Контролируемые UI-компоненты |
| Radix UI | latest | Доступность |
| Lucide React | latest | Иконки |
| Sonner | latest | Уведомления |
| TanStack Query | 5 | Серверное состояние |
| React Hook Form | latest | Формы |
| Zod | latest | Валидация |

## Backend

| Инструмент | Версия | Почему |
|------------|--------|--------|
| Node.js | 22 LTS | Стабильная серверная платформа |
| NestJS | 11 | Масштабируемая архитектура |
| Prisma | 6 | Удобная ORM |
| PostgreSQL | 16 | Основная БД |
| Redis | 7 | Кэш и очереди |
| BullMQ | latest | Фоновые задачи |

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