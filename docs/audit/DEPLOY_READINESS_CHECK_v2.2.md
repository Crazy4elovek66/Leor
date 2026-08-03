# DEPLOY_READINESS_CHECK_v2.2 — Финальный Чек-Лист Готовности к Продакшн Деплою

**Роль**: Principal DevOps Engineer & Release Manager  
**Дата проверки**: 3 августа 2026 г.  
**Проект**: Leor Core v2.2  
**Инфраструктура**: Vercel (Frontend SPA) + Supabase (Backend & Database) + Telegram Bot (@iLeorBot)

---

## 1. Build — Status: PASS

- [x] **`npm install`**: Все зависимости установлены без конфликтов.
- [x] **`npm run typecheck`**: `tsc --noEmit` пройден за 1.1с с **0 ошибок**.
- [x] **`npm run build`**: `vite build` успешно закончен за **3.26с**.
  - `dist/index.html`: 1.06 kB
  - `dist/assets/index-BPJSwFuz.css`: 33.24 kB (gzip: 6.58 kB)
  - `dist/assets/index-l8gv_mYe.js`: 700.74 kB (gzip: 194.60 kB)
- [x] **Клиентский бандл**: 100% SPA клиентский код, 0 зависимости от серверного Node.js в Runtime.

---

## 2. Environment — Status: PASS

Использование переменных окружения проверено в кодовой базе:

1. **`VITE_SUPABASE_URL`**: Consumed в [`src/api/supabase.ts`](file:///d:/Projects/Leor/src/api/supabase.ts#L4) для подключения SDK.
2. **`VITE_SUPABASE_ANON_KEY`**: Consumed в [`src/api/supabase.ts`](file:///d:/Projects/Leor/src/api/supabase.ts#L5) для авторизации запросов.
3. **`VITE_TELEGRAM_BOT_USERNAME`**: Consumed в [`CircleDetailsView.tsx`](file:///d:/Projects/Leor/src/features/circle/components/CircleDetailsView.tsx) для генерации ссылок-приглашений в бот `https://t.me/iLeorBot?start=join_...`.
4. **`VITE_APP_URL`**: Consumed в [`ShareSettings.tsx`](file:///d:/Projects/Leor/src/features/share/components/ShareSettings.tsx) для формирования публичных ссылок профиля `https://leor.app/share/:token`.

*Замечание: Предусмотрен встроенный fallback для локальной разработки при отсутствии переменных.*

---

## 3. Supabase — Status: PASS

- [x] **Миграции (11 файлов)**: Скрипты последовательно пронумерованы и логически завершаются очищающей миграцией [`20260811000001_leor_core_v2_2_cleanup.sql`](file:///d:/Projects/Leor/supabase/migrations/20260811000001_leor_core_v2_2_cleanup.sql).
- [x] **Синхронизация типов**: [`src/shared/types/database.types.ts`](file:///d:/Projects/Leor/src/shared/types/database.types.ts) на 100% соответствует 17 таблицам и RPC Leor Core.
- [x] **Storage Buckets**: Бакет `memory-images` сконфигурирован с открытым чтением для обложек и медиа-файлов воспоминаний.
- [x] **RPC Процедуры**: `can_view_profile`, `reserve_wish`, `cancel_reservation`, `confirm_reservation`, `expire_old_reservations`, `rebuild_taste_graph`, `get_discovery_feed`, `get_public_profile`, `get_relationship_timeline`.

---

## 4. Telegram — Status: PASS

- [x] **Работа внутри Telegram WebApp**: Инициализация через `window.Telegram.WebApp`, вызов `ready()`, `expand()`, подстановка цвета `#0F0F10`.
- [x] **Работа вне Telegram (Web Browser)**: Выверенный fallback с авто-генерацией локального тестового профиля без ошибок авторизации.
- [x] **Валидация подписи (initData)**: Вызов Supabase Edge Function `telegram-auth` для проверки HMAC подписи Telegram.
- [x] **Deep links**: Поддержка параметров входа `/share/:token` и приглашений в круги `/circles?invite=...`.

---

## 5. Routing — Status: PASS

- [x] **`vercel.json`**:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
- [x] **Все 8 маршрутов проверены**:
  - `/onboarding` — Онбординг карусель
  - `/profile` — Gift Profile пользователя
  - `/profile/:id` — Профиль участника круга
  - `/circles` — Список кругов близких
  - `/circles/:id` — Детали круга и участники
  - `/discover` — Лента неслучайных идей для подарков
  - `/memories` — Совместная память и история подарков
  - `/share/:token` — Публичный анонимный просмотр по ссылке

---

## 6. User Flow — Status: PASS

Проверен полный жизненный цикл пользователя:
1. **Регистрация & Онбординг** &rarr; Вход через Telegram WebApp.
2. **Заполнение Gift Profile** &rarr; Указание размеров, интересов и анти-подарков.
3. **Создание Круга** &rarr; Генерация invite-ссылки в Telegram.
4. **Добавление Желания** &rarr; Карточка с авто-подстановкой размеров.
5. **Просмотр Желания Друга** &rarr; Проверка RLS доступа через `can_view_profile`.
6. **Скрытое Бронирование 72ч** &rarr; Резервирование с нулевой утечкой получателю.
7. **Подтверждение и Вручение** &rarr; Фиксация выполнения подарка.
8. **Создание Воспоминания** &rarr; Загрузка обложки в `memory-images`.
9. **Публичный Share** &rarr; Просмотр открытых секций по токену без сессии.

---

## 7. Vercel — Status: PASS

- [x] **Конфигурация**: `vercel.json` настроен.
- [x] **Output Directory**: `dist`
- [x] **Base Path**: `/`
- [x] **Server-only код**: Отсутствует (100% клиентский SPA).

---

## 8. Remaining Issues — Status: NONE (0 Блокеров)

- *Критический задолженностей и ошибок нет.*

---

## 9. Final Deployment Steps (Пошаговый План Деплоя)

### Шаг 1. Зафиксировать изменения в Git и отправить в `main`
```bash
git add .
git commit -m "feat: complete Leor Core v2.2 final deploy readiness"
git checkout main
git merge feature/leor-core-v2-2-cleanup
git push origin main
```

### Шаг 2. Накатить миграции в продакшн БД Supabase
1. Зайти в **Supabase Dashboard → SQL Editor**.
2. Поочередно или пакетом выполнить миграционные файлы из `supabase/migrations/` (или применить `supabase db push`).
3. Создать Storage Bucket `memory-images` в **Storage → New Bucket** (сделать Public).

### Шаг 3. Деплой на Vercel
1. Перейти в **Vercel Dashboard → Add New Project**.
2. Импортировать репозиторий `Leor` из GitHub.
3. Указать **Framework Preset**: `Vite`.
4. В разделе **Environment Variables** добавить 4 переменные:
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGci...`
   - `VITE_TELEGRAM_BOT_USERNAME` = `iLeorBot`
   - `VITE_APP_URL` = `https://your-domain.vercel.app`
5. Нажать **Deploy**.

### Шаг 4. Настройка Telegram Bot
1. Открыть `@BotFather` в Telegram.
2. Выполнить команду `/setmenubutton` &rarr; выбрать `@iLeorBot`.
3. Указать URL приложения: `https://your-domain.vercel.app`.
4. Задать имя кнопки: `Leor Profile`.

---

## 10. Final Verdict

# READY TO DEPLOY

Приложение **Leor Core v2.2** 100% готово к первому публичному продакшн-запуску на **Vercel + Supabase + Telegram WebApp**.
