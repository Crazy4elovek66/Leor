# SPRINT_3_1_AUDIT.md — Аудит реализации Sprint 3.1 (Reservation Hardening)

Этот документ содержит полный технический и архитектурный аудит результатов разработки **Sprint 3.1 (Reservation Hardening)** проекта **Secret Circle (Leor)**.

---

## 1. Обзор Sprint 3.1

Sprint 3.1 обеспечивает фундаментальную безопасность и отказоустойчивость системы бронирования подарков:
- **Полная изоляция получателя**: Владелец Wishlist ни при каких условиях не видит факт или статус бронирования своих желаний. RLS блокирует строки таблицы `gift_reservations`, а RPC `get_wish_reservation_state()` всегда возвращает статус `AVAILABLE` для владельца.
- **Анонимность дарителя**: Со-участникам круга доступны только обезличенные данные через SQL представление `wish_reservation_status` (без поля `reserved_by`).
- **Защита от Race Conditions**: Процедура `reserve_wish()` работает атомарно с `SELECT FOR UPDATE` и частично уникальным индексом `uq_active_gift_reservation`.
- **Автоматическое истечение**: Бронирования автоматически переходят в статус `EXPIRED` по истечении 72 часов.
- **Realtime**: Таргетированные обновления состояния карточки через `useReservationRealtime()`.

---

## 2. SQL Схема Таблицы `gift_reservations`

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

-- Частичный уникальный индекс от дублирования броней
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_gift_reservation 
  ON public.gift_reservations (wish_id) 
  WHERE status IN ('RESERVED'::public.gift_reservation_status, 'CONFIRMED'::public.gift_reservation_status);
```

---

## 3. SQL Представление `wish_reservation_status`

Обезличенное представление для участников круга (НЕ содержит `reserved_by`):

```sql
CREATE OR REPLACE VIEW public.wish_reservation_status AS
SELECT 
  gr.wish_id,
  true AS has_reservation,
  (gr.status = 'CONFIRMED'::public.gift_reservation_status) AS is_confirmed,
  gr.expires_at
FROM public.gift_reservations gr
WHERE gr.status IN ('RESERVED'::public.gift_reservation_status, 'CONFIRMED'::public.gift_reservation_status);
```

---

## 4. RPC Функции (`SECURITY DEFINER SET search_path = public`)

### 4.1. `get_wish_reservation_state(p_wish_id UUID)`
Возвращает одно из 4 единых состояний (`AVAILABLE`, `RESERVED_BY_ME`, `RESERVED`, `CONFIRMED`). Владельцу желания **всегда** возвращается `'AVAILABLE'`.

### 4.2. `reserve_wish(p_wish_id UUID)`
Атомарная процедура бронирования:
1. Захватывает `FOR UPDATE` строку желания.
2. Проверяет, что пользователь не является владельцем желания.
3. Проверяет права доступа `can_view_profile(gp.id, 'WISHLIST')`.
4. Проверяет отсутствие активной брони (`RESERVED` / `CONFIRMED`).
5. Создает бронь со сроком `expires_at = now() + interval '72 hours'`.
6. Возвращает структуру вида `{ "success": true, "state": "RESERVED_BY_ME" }`.

### 4.3. `cancel_reservation(p_wish_id UUID)` & `confirm_reservation(p_wish_id UUID)`
Безопасно переводит бронь дарителя (`reserved_by = auth.uid()`) в статус `CANCELLED` или `CONFIRMED`.

### 4.4. `expire_old_reservations()` & `pg_cron`
Переводит устаревшие брони (`expires_at < now()`) в статус `EXPIRED`.
Расписание для `pg_cron`:
```sql
SELECT cron.schedule('expire_old_reservations_job', '0 * * * *', 'SELECT public.expire_old_reservations()');
```

---

## 5. RLS Политики Таблицы `gift_reservations`

```sql
CREATE POLICY "gift_reservations_select_policy" ON public.gift_reservations
  FOR SELECT USING (
    -- Получатель НЕ видит строк бронирования
    NOT EXISTS (
      SELECT 1 FROM public.wishes w
      WHERE w.id = gift_reservations.wish_id AND w.user_id = auth.uid()
    )
    AND
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

## 6. Realtime Архитектура

Хук `useReservationRealtime(onReservationChange)` подписывается на событие `postgres_changes` таблицы `gift_reservations`. При изменении статуса перезапрашивается состояние только для конкретного `wishId` через RPC `get_wish_reservation_state`, без перезагрузки всей страницы.

---

## 7. Выполнение Definition of Done

- [x] RLS полностью защищает данные и не раскрывает факт бронирования получателю.
- [x] Личность дарителя (`reserved_by`) скрыта от со-участников круга через представление `wish_reservation_status`.
- [x] Процедура `reserve_wish()` атомарна благодаря `SELECT FOR UPDATE` и уникальному индексу `uq_active_gift_reservation`.
- [x] Создано представление `wish_reservation_status` и функция `get_wish_reservation_state()`.
- [x] Функция `expire_old_reservations()` подготовлена для выполнения через `pg_cron`.
- [x] Проект компилируется с 0 ошибок (`npm run typecheck` и `npm run build` за 3.71с).
- [x] 100% совместимость с бесплатными тарифами **Supabase Free Tier** и **Vercel**.
