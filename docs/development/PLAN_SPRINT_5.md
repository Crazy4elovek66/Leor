# PLAN_SPRINT_5.md — План Реализации Sprint 5 (Gift Discovery Engine MVP)

Документ описывает технический план реализации **Sprint 5 (Gift Discovery Engine MVP)** проекта **Secret Circle (Leor)**.

---

## 1. Обзор Sprint 5

### Главная цель
Построить первый персональный **Gift Discovery Engine** на основе **Taste Graph** без использования AI, LLM, эмбеддингов или векторного поиска. Все рекомендации рассчитываются детерминированно в PostgreSQL 16.

---

## 2. Архитектура СУБД & RPC Функция (`get_discovery_feed`)

### 2.1. Миграция `supabase/migrations/20260805000001_sprint_5_discovery_engine.sql`
RPC Функция `get_discovery_feed(p_limit INT DEFAULT 20)`:
1. Фильтрует открытые карточки желаний (`wishes`) других участников из совместных кругов текущего пользователя (`auth.uid()`).
2. Проверяет права доступа `can_view_profile(w_user.profile_id, 'WISHLIST')`.
3. Сопоставляет категорию и бренд желания со страницами `taste_graph_nodes` и `taste_graph_edges` текущего пользователя.
4. Вычисляет итоговый балл (0–100):
   $$\text{score} = \min(100, \text{round}((\text{node\_weight} \times 0.5 + \text{edge\_strength} \times 0.3 + \text{priority\_weight} \times 0.2) \times 100))$$
5. Формирует динамический массив объяснений `reasons` («Совпадает с вашими интересами: Sony», «Похоже на ваши предпочтения в TECH»).

---

## 3. Фронтенд Модуль `src/features/discovery/`

- `types.ts`: Интерфейс `DiscoveryItem` (score, matchPercentage, reasons, matchedNodes).
- `hooks/useDiscoveryFeed.ts`: Хук загрузки персональной ленты рекомендаций через `get_discovery_feed`.
- `components/DiscoveryCard.tsx`: Карточка рекомендации с процентом совпадения, акцентным бейджем, информацией о владельце и объяснениями reasons.
- `components/DiscoveryFeedView.tsx`: Экран персональной ленты `/discover`.

---

## 4. Навигация & Маршрутизация

- Добавление маршрута `/discover` в `AppRouter.tsx`.
- Обновление `BottomNavigation.tsx`: Добавление вкладки «Открытия» (`Sparkles` / `Compass`).

---

## 5. План Выполнения

1. SQL миграция `20260805000001_sprint_5_discovery_engine.sql`
2. Обновление `database.types.ts`
3. Создание фронтенд модуля `src/features/taste/` & `src/features/discovery/`
4. Настройка маршрута `/discover` и обновления нижней навигации
5. Проверка `npm run typecheck` и `npm run build`
6. Создание документации `docs/development/SPRINT_5_AUDIT.md`
