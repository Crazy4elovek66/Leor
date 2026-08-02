# PLAN_SPRINT_4.md — План Реализации Sprint 4 (Taste Graph MVP)

Документ описывает технический план реализации **Sprint 4 (Taste Graph MVP)** проекта **Secret Circle (Leor)**.

---

## 1. Обзор Sprint 4

### Главная цель
Создать фундамент **Taste Graph** — графа вкусов пользователя, объединяющего явные интересы (`taste_items`), бренды и категории желаний (`wishes`) и размеры (`profile_sizes`) в структурированный граф предпочтений с динамическими весами и связями.

> ⛔ **Исключения**: Никакого AI, ML, сторонних графовых БД, Redis или платных сервисов. Все вычисления производятся в PostgreSQL 16 через бессерверные процедуры `rebuild_taste_graph` и `calculate_taste_weight`.

---

## 2. Архитектура Базы Данных (`supabase/migrations/20260804000001_sprint_4_taste_graph.sql`)

### 2.1. PostgreSQL ENUM `taste_node_type`
`BRAND`, `CATEGORY`, `STYLE`, `COLOR`, `MATERIAL`, `HOBBY`, `BOOK`, `MOVIE`, `GAME`, `MUSIC`, `TRAVEL`, `FOOD`, `CREATOR`, `OTHER`.

### 2.2. Таблицы Графа
1. **`public.taste_graph_nodes`**:
   - `id`: UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
   - `user_id`: UUID NOT NULL REFERENCES `public.users(id)` ON DELETE CASCADE
   - `node_type`: `public.taste_node_type` NOT NULL
   - `value`: TEXT NOT NULL
   - `weight`: NUMERIC(3, 2) NOT NULL DEFAULT 0.50 (CHECK `weight >= 0.00 AND weight <= 1.00`)
   - `source`: TEXT NOT NULL DEFAULT 'SYSTEM'
   - `created_at`, `updated_at`
   - UNIQUE constraint: `(user_id, node_type, value)`
2. **`public.taste_graph_edges`**:
   - `id`: UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
   - `user_id`: UUID NOT NULL REFERENCES `public.users(id)` ON DELETE CASCADE
   - `from_node_id`: UUID NOT NULL REFERENCES `public.taste_graph_nodes(id)` ON DELETE CASCADE
   - `to_node_id`: UUID NOT NULL REFERENCES `public.taste_graph_nodes(id)` ON DELETE CASCADE
   - `strength`: NUMERIC(3, 2) NOT NULL DEFAULT 0.50 (CHECK `strength >= 0.00 AND strength <= 1.00`)
   - `created_at`
   - UNIQUE constraint: `(user_id, from_node_id, to_node_id)`

---

## 3. Функция Построения и Расчета Графа (`rebuild_taste_graph`)

### 3.1. `calculate_taste_weight(p_user_id, p_node_type, p_value)`
Вычисляет итоговый вес узла (от `0.00` до `1.00`) исходя из:
- Записей в `taste_items` (вес `weight` из базы)
- Наличия и приоритетов в `wishes` (приоритет `HIGH` дает больше веса, `brand` и `category`)

### 3.2. `rebuild_taste_graph(p_user_id)`
1. Удаляет устаревшие `edges` пользователя.
2. Собирает узлы из `taste_items`, `wishes` и `profile_sizes`.
3. Рассчитывает веса `weight`.
4. Связывает категории с брендами и увлечениями, рассчитывая силу связи `strength`.

### 3.3. Триггеры Перестройки
Автоматический вызов `rebuild_taste_graph()` при изменении таблиц `taste_items`, `wishes` и `profile_sizes`.

---

## 4. RPC Функция `get_taste_graph(p_profile_id)`

`SECURITY DEFINER SET search_path = public` под контролем RLS `can_view_profile(p_profile_id, 'INTERESTS')`:
Возвращает JSON с `nodes`, `edges`, `top_categories` и `top_brands`.

---

## 5. Фронтенд Модуль `src/features/taste/`

- `types.ts`: Интерфейсы `TasteNode`, `TasteEdge`, `TasteGraphData`.
- `hooks/useTasteGraph.ts`: Загрузка данных графа через RPC `get_taste_graph`.
- `components/TasteCategoryCloud.tsx`: Сетка-облако категорий с индикаторами весов.
- `components/TasteBrandList.tsx`: Карточки бренда с весом предпочтения.
- `components/TasteStrengthBar.tsx`: Прогресс-бар веса/силы связи.
- `components/TasteGraphView.tsx`: Главный контейнер блока Taste Graph на странице `/profile`.

---

## 6. План Пакетного Выполнения

1. SQL миграция `20260804000001_sprint_4_taste_graph.sql`
2. Обновление `database.types.ts`
3. Создание фронтенд модуля `src/features/taste/`
4. Интеграция в `/profile` и `/profile/:id`
5. Проверка `npm run typecheck` и `npm run build`
6. Создание `docs/development/SPRINT_4_AUDIT.md`
