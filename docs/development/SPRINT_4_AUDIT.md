# SPRINT_4_AUDIT.md — Аудит реализации Sprint 4 & 4.1 (Taste Graph MVP & Hardening)

Этот документ содержит полный технический и архитектурный аудит результатов разработки **Sprint 4 (Taste Graph MVP)** и **Sprint 4.1 (Taste Graph Hardening)** проекта **Secret Circle (Leor)**.

---

## 1. Обзор Sprint 4 & Sprint 4.1

В рамках Sprint 4 и Sprint 4.1 создан фундамент **Taste Graph** — графового слоя предпочтений пользователя между **Gift Profile** и **Wishlist**:
- **Co-occurrence Edge Engine**: Связи строятся автоматически между ВСЕМИ узлами любого типа (`BRAND ↔ BRAND`, `CATEGORY ↔ CATEGORY`, `CATEGORY ↔ BRAND`, `HOBBY ↔ CATEGORY` и др.), встречающимися совместно в одном контексте.
- **Динамическая сила связей**: Сила связи вычисляется по формуле:
  $$\text{strength} = \min(1.0, \text{shared\_occurrences} \times 0.25)$$
- **UPSERT и Отслеживание Источников**: При повторном совместном появлении узлов обновляются показатели `strength` и `source_count`, без пересоздания ребер.
- **Защита плотности графа (Graph Density Protection)**: Установлено жесткое ограничение — не более 1000 ребер на пользователя. При превышении автоматически сохраняются только самые сильные связи (`strength DESC`).
- **0% AI / ML**: Все вычисления строго детерминированы и выполняются на стороне PostgreSQL 16 через процедуру `rebuild_taste_graph`.
- **100% Free Infrastructure**: Совместимость с **Supabase Free Tier** и **Vercel**.

---

## 2. SQL Схема и Таблицы

### 2.1. PostgreSQL ENUM `taste_node_type`
`BRAND`, `CATEGORY`, `STYLE`, `COLOR`, `MATERIAL`, `HOBBY`, `BOOK`, `MOVIE`, `GAME`, `MUSIC`, `TRAVEL`, `FOOD`, `CREATOR`, `OTHER`.

### 2.2. Таблица `public.taste_graph_nodes`
```sql
CREATE TABLE IF NOT EXISTS public.taste_graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  node_type public.taste_node_type NOT NULL,
  value TEXT NOT NULL,
  weight NUMERIC(3, 2) NOT NULL DEFAULT 0.50 CONSTRAINT chk_taste_node_weight CHECK (weight >= 0.00 AND weight <= 1.00),
  source TEXT NOT NULL DEFAULT 'SYSTEM',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_taste_graph_nodes_user_type_value UNIQUE (user_id, node_type, value)
);
```

### 2.3. Таблица `public.taste_graph_edges` (Sprint 4.1 Hardened)
```sql
CREATE TABLE IF NOT EXISTS public.taste_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_node_id UUID NOT NULL REFERENCES public.taste_graph_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES public.taste_graph_nodes(id) ON DELETE CASCADE,
  strength NUMERIC(3, 2) NOT NULL DEFAULT 0.50 CONSTRAINT chk_taste_edge_strength CHECK (strength >= 0.00 AND strength <= 1.00),
  source_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_taste_graph_edges_user_from_to UNIQUE (user_id, from_node_id, to_node_id)
);
```

---

## 3. Taste Graph Hardening (Sprint 4.1)

### 3.1. Алгоритм Совместной Встречаемости (Co-occurrence)
Процедура `rebuild_taste_graph(p_user_id)` сопоставляет комбинации пар узлов во временной таблице `temp_co_occurrences` и рассчитывает `source_count` для всех связанных объектов пользователя.

### 3.2. Динамический Расчет Силы и UPSERT
```sql
INSERT INTO public.taste_graph_edges (user_id, from_node_id, to_node_id, strength, source_count)
SELECT 
  p_user_id,
  from_id,
  to_id,
  LEAST(1.00, round(occurrences * 0.25, 2)) AS strength,
  occurrences AS source_count
FROM temp_co_occurrences
ON CONFLICT (user_id, from_node_id, to_node_id) 
DO UPDATE SET 
  strength = EXCLUDED.strength,
  source_count = EXCLUDED.source_count;
```

### 3.3. Защита от Чрезмерной Плотности (Graph Density Protection)
```sql
IF v_edge_count > 1000 THEN
  DELETE FROM public.taste_graph_edges
  WHERE id IN (
    SELECT id FROM public.taste_graph_edges
    WHERE user_id = p_user_id
    ORDER BY strength ASC, source_count ASC
    OFFSET 1000
  );
END IF;
```

---

## 4. RPC Функция `get_taste_graph(p_profile_id UUID)`

`SECURITY DEFINER SET search_path = public` под контролем RLS `can_view_profile(p_profile_id, 'INTERESTS')`:
Возвращает структуру данных графа для визуализации на фронтенде без изменения контракта API.

---

## 5. Выполнение Definition of Done

- [x] Связи строятся автоматически между всеми совместно встречающимися узлами.
- [x] Сила связей (`strength`) вычисляется динамически по формуле `min(1.0, occurrences * 0.25)`.
- [x] Используется безопасный `UPSERT` без удаления/пересоздания действующих ребер.
- [x] Добавлена колонка `source_count` для учета количества подтверждений связей.
- [x] Реализована защита от плотности графа (максимум 1000 ребер на пользователя).
- [x] `npm run typecheck` — 0 ошибок.
- [x] `npm run build` — Успешная сборка фронтенда за 3.00с.
- [x] Обновлен отчёт `SPRINT_4_AUDIT.md`.
