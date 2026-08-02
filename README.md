# Leor — Private Circle for Wishes, Gifts & Memories

> **Leor** — личная карта человека для его близкого круга. Приватное пространство в Telegram WebApp, где желания, интересы, размеры, мечты и хобби объединены в красивом и безопасном профиле (Gift Profile).

---

## 🚀 Стек технологий

### Frontend
- **React 19** — основной UI фреймворк
- **Vite 7** — инструмент сборки и dev-сервер
- **TypeScript 5.9+** — строгая типобезопасность
- **Tailwind CSS v4** — современная система стилей и дизайн-токенов
- **shadcn/ui** — доступные базовые UI-компоненты
- **React Router 7** — маршрутизация приложения
- **TanStack Query 5** — серверное состояние и кэширование
- **Zustand** — локальное состояние
- **Lucide React & Sonner** — иконки и уведомления

### Backend (Supabase Free Tier)
- **Supabase PostgreSQL 16** — базовая реляционная СУБД с RLS в `snake_case`
- **Supabase Auth** — пользовательские сессии и авторизация Telegram `initData`
- **Supabase Storage** — бесплатное хранение медиа-файлов и аватаров
- **Supabase Edge Functions** — бессерверные Deno-функции (HMAC валидация, бота-хелперы)

---

## 📁 Структура проекта

```text
Leor/
├── src/                      # Исходный код React 19 фронтенда
│   ├── app/                  # Инициализация приложения и глобальные провайдеры
│   ├── providers/            # Supabase, Telegram, QueryClient провайдеры
│   ├── router/               # Маршрутизация (React Router 7)
│   ├── layouts/              # Макеты страниц и отступы Telegram Safe Area
│   ├── features/             # Модули фичей (auth, profile)
│   ├── components/           # UI и общие компоненты (shadcn/ui, Header, BottomNav)
│   ├── shared/               # TypeScript типы (database.types.ts)
│   ├── api/                  # Supabase JS Client (@supabase/supabase-js)
│   ├── lib/                  # Telegram WebApp SDK утилиты
│   ├── hooks/                # Кастомные React-хуки
│   ├── styles/               # Глобальные токены CSS (#0F0F10, #17171A, #D8B4B0)
│   └── assets/               # Иконки и графические ресурсы
│
├── supabase/                 # Бессерверная инфраструктура Supabase
│   ├── functions/            # Edge Functions (telegram-auth на Deno)
│   ├── migrations/           # PostgreSQL миграции (0-cost SQL + RLS)
│   └── seed.sql              # Сиды данных
│
├── public/                   # Статические ресурсы веб-приложения
├── docs/                     # Полная проектная документация
│   ├── architecture/         # Архитектура и схема БД
│   ├── product/              # Спецификация продукта и задачи
│   ├── development/          # Стандарты разработки, стек и план
│   ├── design/               # Дизайн-система и рекомендации
│   └── CHANGELOG.md          # История изменений
│
├── .env.example              # Пример переменных окружения
├── .gitignore                # Исключения Git
├── package.json              # Зависимости и скрипты
├── tsconfig.json             # Конфигурация TypeScript
├── vite.config.ts            # Конфигурация Vite
└── vercel.json               # Конфигурация деплоя на Vercel (SPA rewrites)
```

---

## 🛠️ Команды запуска

```bash
# 1. Установка зависимостей
npm install

# 2. Запуск локального dev-сервера (http://localhost:3000)
npm run dev

# 3. Проверка типов TypeScript
npm run typecheck

# 4. Сборка продуктивной версии
npm run build

# 5. Предпросмотр сборки
npm run preview
```

---

## ⚡ Команды Supabase

```bash
# Локальный запуск инстанса Supabase
supabase start

# Применение новых SQL миграций к БД
supabase db push

# Генерация TypeScript типов из схемы PostgreSQL
supabase gen types typescript --local > src/shared/types/database.types.ts

# Деплой Edge Function в облако Supabase
supabase functions deploy telegram-auth --no-verify-jwt

# Установка секретов Edge Functions (TELEGRAM_BOT_TOKEN)
supabase secrets set TELEGRAM_BOT_TOKEN="ваш_telegram_bot_token"
```

---

## 🌐 Команды Vercel

```bash
# Запуск локальной эмуляции Vercel
npx vercel dev

# Деплой тестовой версии (Preview)
npx vercel

# Продуктивный деплой в продакшн
npx vercel --prod
```

### Переменные окружения Vercel:
- `VITE_SUPABASE_URL` — публичный URL Supabase
- `VITE_SUPABASE_ANON_KEY` — публичный анонимный ключ Supabase
- `VITE_TELEGRAM_BOT_NAME` — юзернейм Telegram бота (`iLeorBot`)

---

## 📚 Документация в `docs/`

Все продуктовые и технические решения зафиксированы в соответствующих разделах:

- **Архитектура**:
  - [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) — принцыпы Simple Feature Architecture
  - [DATABASE_SCHEMA_v2.1_FROZEN.md](docs/architecture/DATABASE_SCHEMA_v2.1_FROZEN.md) — Замороженная схема БД v2.1
- **Продукт**:
  - [PRODUCT_SPEC_v2.1_FROZEN.md](docs/product/PRODUCT_SPEC_v2.1_FROZEN.md) — Продуктовая спецификация
  - [TASKS.md](docs/product/TASKS.md) — Дорожная карта спринтов
- **Разработка**:
  - [AGENTS.md](docs/development/AGENTS.md) — Правила и стандарты AI-агентов
  - [TECH_SPEC.md](docs/development/TECH_SPEC.md) — Техническая спецификация
  - [SECURITY_CHECKLIST.md](docs/development/SECURITY_CHECKLIST.md) — Чек-лист безопасности и секретов
  - [IMPLEMENTATION_PLAN.md](docs/development/IMPLEMENTATION_PLAN.md) — План реализации Sprint 1 & 1.1
  - [PLAN_SPRINT_2A.md](docs/development/PLAN_SPRINT_2A.md) — План реализации Sprint 2A (Social Graph)
  - [FOUNDATION_FREEZE.md](docs/development/FOUNDATION_FREEZE.md) — Официальная заморозка фундамента (Sprint 1.2)
  - [SPRINT_1_AUDIT.md](docs/development/SPRINT_1_AUDIT.md) — Полный технический аудит Sprint 1
  - [SPRINT_1.1_AUDIT.md](docs/development/SPRINT_1.1_AUDIT.md) — Полный технический аудит Sprint 1.1 (Hardening)
  - [SPRINT_1.2_AUDIT.md](docs/development/SPRINT_1.2_AUDIT.md) — Полный технический аудит Sprint 1.2 (Foundation Freeze)
  - [SPRINT_2A_AUDIT.md](docs/development/SPRINT_2A_AUDIT.md) — Полный технический аудит Sprint 2A (Social Graph)
  - [SPRINT_2A_1_AUDIT.md](docs/development/SPRINT_2A_1_AUDIT.md) — Полный технический аудит Sprint 2A.1 (Access Hardening)
- **Дизайн**:
  - [DESIGN_GUIDELINES.md](docs/design/DESIGN_GUIDELINES.md) — Цветовая палитра `#0F0F10`, `#17171A`, `#D8B4B0` и типографика
- **История изменений**:
  - [CHANGELOG.md](docs/CHANGELOG.md) — Ченджлог версий
