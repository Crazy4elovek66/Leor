# PLAN_SPRINT_7.md — План Реализации Sprint 7 (Memories & Relationship Timeline)

Документ описывает технический план реализации **Sprint 7 (Memories & Relationship Timeline)** проекта **Secret Circle (Leor)**.

---

## 1. Обзор Sprint 7

### Главная цель
Создать систему совместных воспоминаний и хронологии отношений (**Relationship Timeline**), объединяющую события, фотографии, забронированные и полученные подарки (`wishes` и `gift_reservations`) в единый таймлайн памяти.

---

## 2. Архитектура Базы Данных (`supabase/migrations/20260807000001_sprint_7_memories.sql`)

### 2.1. PostgreSQL ENUM `memory_type`
`GIFT`, `EVENT`, `PHOTO`, `TRAVEL`, `CELEBRATION`, `ACHIEVEMENT`, `MILESTONE`, `OTHER`.

### 2.2. Таблицы
1. **`public.memories`**:
   - `id`: UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
   - `owner_user_id`: UUID NOT NULL REFERENCES `public.users(id)` ON DELETE CASCADE
   - `circle_id`: UUID REFERENCES `public.circles(id)` ON DELETE SET NULL
   - `wish_id`: UUID REFERENCES `public.wishes(id)` ON DELETE SET NULL
   - `gift_reservation_id`: UUID REFERENCES `public.gift_reservations(id)` ON DELETE SET NULL
   - `title`: TEXT NOT NULL
   - `description`: TEXT
   - `memory_type`: `public.memory_type` NOT NULL DEFAULT 'EVENT'
   - `event_date`: DATE NOT NULL DEFAULT CURRENT_DATE
   - `cover_image_url`: TEXT
   - `created_at`, `updated_at`
2. **`public.memory_participants`**:
   - `id`: UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
   - `memory_id`: UUID NOT NULL REFERENCES `public.memories(id)` ON DELETE CASCADE
   - `user_id`: UUID NOT NULL REFERENCES `public.users(id)` ON DELETE CASCADE
   - `role`: TEXT DEFAULT 'PARTICIPANT'
   - UNIQUE `(memory_id, user_id)`
3. **`public.memory_media`**:
   - `id`: UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
   - `memory_id`: UUID NOT NULL REFERENCES `public.memories(id)` ON DELETE CASCADE
   - `image_url`: TEXT NOT NULL
   - `sort_order`: INT NOT NULL DEFAULT 0
   - `created_at`

### 2.3. RPC Функция `get_relationship_timeline(p_profile_id UUID)`
Возвращает хронологический JSON массив объединяющий воспоминания, врученные подарки и этапы списков желаний, отсортированные по `event_date DESC, created_at DESC` под защитой `can_view_profile(p_profile_id, 'MEMORIES')`.

---

## 3. Фронтенд Модуль `src/features/memories/`

- `types.ts`: Доменные типы `MemoryItem`, `MemoryParticipant`, `MemoryMedia`, `TimelineItem`.
- `hooks/useMemories.ts`: CRUD действия для воспоминаний.
- `hooks/useTimeline.ts`: Загрузка хронологии через `get_relationship_timeline`.
- `components/MemoryCard.tsx`: Карточка воспоминания в ленте.
- `components/MemoryGallery.tsx`: Галерея медиафайлов.
- `components/RelationshipTimeline.tsx`: Визуальный компонент хронологии отношений по годам и месяцам.
- `components/CreateMemoryModal.tsx`: Модальное окно создания события.
- `components/MemoryDetailsView.tsx`: Страница детального просмотра воспоминания `/memories/:id`.

---

## 4. План Выполнения

1. SQL миграция `20260807000001_sprint_7_memories.sql`
2. Обновление `database.types.ts`
3. Создание Supabase Storage бакета `memory-images`
4. Разработка модуля `src/features/memories/`
5. Настройка маршрутов `/memories` и `/memories/:id` в `AppRouter.tsx`
6. Активация вкладки Память в `BottomNavigation.tsx`
7. Проверка `npm run typecheck` и `npm run build`
8. Создание отчёта `docs/development/SPRINT_7_AUDIT.md`
