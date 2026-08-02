# PLAN_SPRINT_3.md — План Реализации Sprint 3 (Gift Reservations MVP)

Документ описывает подробный архитектурный и технический план реализации **Sprint 3 (Gift Reservations MVP)** проекта **Secret Circle (Leor)**.

---

## 1. Обзор Sprint 3

### Главная цель
Реализовать систему **скрытого бронирования подарков** (Gift Reservations) для предотвращения дублирования подарков между дарителями.

### Главные принципы архитектуры:
1. 🙈 **Полное сокрытие от получателя**: Владелец Wishlist **никогда** не видит статус бронирования своего желания. Для него карточка всегда отображается как обычное желание без каких-либо индикаторов.
2. 🕵️ **Анонимность дарителя**: Участники круга видят статус («Забронировано» или «Куплено»), но имя и личность забронировавшего дарителя **строго скрыты**.
3. ⚡ **Атомарность и защита от Race Conditions**: Бронирование выполняется через бессерверную процедуру PostgreSQL `reserve_wish()` с блокировкой `SELECT FOR UPDATE` и частичным уникальным индексом.
4. 🔄 **Supabase Realtime**: Изменения статусов бронирования мгновенно синхронизируются на устройствах всех участников круга без перезагрузки страницы.

> ⛔ **Строго запрещено в Sprint 3**: Совместные сборы, разделение суммы, комментарии, чат, уведомления, AI, Memories, публичные ссылки.

---

## 2. Архитектура Базы Данных (Миграция `20260803000001_sprint_3_gift_reservations.sql`)

### 2.1. PostgreSQL ENUM `gift_reservation_status`
```sql
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gift_reservation_status') THEN
    CREATE TYPE public.gift_reservation_status AS ENUM ('RESERVED', 'CONFIRMED', 'CANCELLED', 'EXPIRED');
  END IF;
END $$;
```

### 2.2. Таблица `public.gift_reservations`
```sql
CREATE TABLE IF NOT EXISTS public.gift_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID NOT NULL REFERENCES public.wishes(id) ON DELETE CASCADE,
  reserved_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status public.gift_reservation_status NOT NULL DEFAULT 'RESERVED'::public.gift_reservation_status,
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '72 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.3. Частичный Уникальный Индекс (Предотвращение дублей бронирования)
```sql
-- Гарантирует наличие максимум одной активной (RESERVED/CONFIRMED) брони на одно желание
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_gift_reservation 
  ON public.gift_reservations (wish_id) 
  WHERE status IN ('RESERVED'::public.gift_reservation_status, 'CONFIRMED'::public.gift_reservation_status);
```

### 2.4. Атомарные RPC Функции PostgreSQL (`SECURITY DEFINER SET search_path = public`)

#### 1. `reserve_wish(p_wish_id UUID)`
- Проверяет, что пользователь не бронирует свое собственное желание (исключение).
- Проверяет права `can_view_profile(wish_owner_profile_id, 'WISHLIST')`.
- Выполняет `SELECT FOR UPDATE` на строке `wishes`.
- Проверяет отсутствие активной брони в `gift_reservations`.
- Вставляет новую запись со статусом `RESERVED` и списыванием `expires_at = now() + interval '72 hours'`.

#### 2. `cancel_reservation(p_wish_id UUID)`
- Переводит активную бронь текущего пользователя (`reserved_by = auth.uid()`) в статус `CANCELLED`, фиксируя `cancelled_at = now()`.

#### 3. `confirm_reservation(p_wish_id UUID)`
- Переводит активную бронь текущего пользователя в статус `CONFIRMED`, фиксируя `confirmed_at = now()`.

#### 4. `expire_old_reservations()`
- Автоматически переводит устаревшие брони (`expires_at < now()` со статусом `RESERVED`) в статус `EXPIRED`.

---

### 2.5. RLS Политики Таблицы `gift_reservations`

```sql
ALTER TABLE public.gift_reservations ENABLE ROW LEVEL SECURITY;

-- 1. Скрытие от владельца желания: Получатель НЕ получает строк бронирований к своим желаниям
CREATE POLICY "gift_reservations_select_policy" ON public.gift_reservations
  FOR SELECT USING (
    -- Не забронировано ли желание самим получателем (проверка, что зритель НЕ владелец желания)
    NOT EXISTS (
      SELECT 1 FROM public.wishes w
      WHERE w.id = gift_reservations.wish_id AND w.user_id = auth.uid()
    )
    AND
    -- Либо это бронь текущего дарителя, либо зритель состояит в круге с доступом к WISHLIST
    (
      reserved_by = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM public.wishes w
        JOIN public.gift_profiles gp ON gp.user_id = w.user_id
        WHERE w.id = gift_reservations.wish_id
          AND public.can_view_profile(gp.id, 'WISHLIST'::public.profile_section)
      )
    )
  );
```

---

## 3. Realtime Подписка

Включение таблицы в публикацию `supabase_realtime`:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_reservations;
```

---

## 4. Фронтенд Архитектура (`src/features/reservation/`)

### 4.1. Доменные Типы (`src/features/reservation/types.ts`)
- `GiftReservationStatus`: `'RESERVED' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'`
- `GiftReservationItem`: интерфейс бронирования.

### 4.2. Кастомные Хуки
- `useWishReservations.ts`:
  - Вызов RPC функций `reserveWish`, `cancelReservation`, `confirmReservation`.
  - Реализация Realtime подписки через `supabase.channel('public:gift_reservations')`.
- `useMyReservations.ts`:
  - Загрузка активных и подтвержденных бронирований текущего пользователя для экрана `/reservations`.

### 4.3. Компоненты & Экран
- **Состояния в `WishCard.tsx`**:
  - Для владельца желания: Карточка без изменений.
  - Для со-участников круга:
    - Статус «Доступно» &rarr; Кнопка «Забронировать».
    - Статус «Забронировано» &rarr; Бейдж пыльно-розового цвета `#D8B4B0` с таймером (до 72ч). Если бронь принадлежит вам — кнопки «Подтвердить покупку» / «Отменить».
    - Статус «Куплено» &rarr; Спокойный бейдж «Куплено».
- **Экран `/reservations` (`MyReservationsView.tsx`)**:
  - Список всех забронированных текущим пользователем подарков с обратным отсчетом времени таймера и быстрым изменением статуса.

---

## 5. План Проверки и Сборки

1. `npm run typecheck` — Проверка абсолютной типизации TypeScript без `any`.
2. `npm run build` — Сборка фронтенда Vite (ожидаемое время < 4с).
3. Проверка полной совместимости с **Supabase Free Tier** и **Vercel**.
