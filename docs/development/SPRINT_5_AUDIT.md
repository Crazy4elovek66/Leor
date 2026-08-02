# SPRINT_5_AUDIT.md — Аудит реализации Sprint 5 (Gift Discovery Engine MVP)

Этот документ содержит полный технический и функциональный аудит результатов разработки **Sprint 5 (Gift Discovery Engine MVP)** проекта **Secret Circle (Leor)**.

---

## 1. Обзор Sprint 5

В рамках Sprint 5 построен первый **Gift Discovery Engine MVP** — детерминированный бессерверный движок персональных рекомендаций подарков на основе **Taste Graph**:
- **0% AI / LLM / Vector Search**: Рекомендации полностью рассчитываются в PostgreSQL 16 через RPC процедуру `get_discovery_feed()`.
- **Совместимость с Бесплатной Инфраструктурой**: 100% работу обеспечивает сочетание **Supabase Free Tier** и **Vercel**.
- **Прозрачность Объяснений (Explanation Engine)**: Каждая карточка рекомендации содержит массив аргументированных причин `reasons` («Совпадает с вашими интересами: Sony», «Похоже на ваши предпочтения в TECH»).
- **Приватность и Права Доступа**: В рекомендациях участвуют карточки желаний только участников общих кругов пользователя, для которых открыт доступ `can_view_profile(w.user_id, 'WISHLIST')`. Собственные желания пользователя исключаются.

---

## 2. Формула Расчета Балла Рекомендации (Recommendation Scoring)

Балл соответствия `score` и процент совпадения `match_percentage` вычисляются по формуле:

$$\text{score} = \min\left(100, \text{round}\left((\text{node\_weight} \times 0.5 + \text{edge\_strength} \times 0.3 + \text{priority\_weight} \times 0.2) \times 100\right)\right)$$

Где:
- `node_weight` — Максимальный вес увлечения/категории/бренда в Taste Graph пользователя (`0.10`–`1.00`).
- `edge_strength` — Максимальная сила связи в графе предпочтений пользователя (`0.20`–`1.00`).
- `priority_weight` — Вес приоритета желания (`HIGH` = 1.00, `MEDIUM` = 0.60, `LOW` = 0.30).

---

## 3. SQL Движок Рекомендаций (`20260805000001_sprint_5_discovery_engine.sql`)

```sql
CREATE OR REPLACE FUNCTION public.get_discovery_feed(p_limit INT DEFAULT 20)
RETURNS JSONB AS $$
...
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## 4. Фронтенд Модуль `src/features/discovery/`

```text
src/features/discovery/
├── components/
│   ├── DiscoveryCard.tsx       # Карточка рекомендации с процентом совпадения и объяснениями
│   └── DiscoveryFeedView.tsx   # Главный экран персональной ленты (/discover)
├── hooks/
│   └── useDiscoveryFeed.ts     # Хук запроса рекомендаций через RPC get_discovery_feed
└── types.ts                    # Доменные типы (DiscoveryItem)
```

---

## 5. Навигация и Доступность

- Маршрут `/discover` интегрирован в `AppRouter.tsx` под защитой `TelegramAuthGuard`.
- Вкладка **«Открытия»** с иконкой `Compass` добавлена в нижнюю панель навигации `BottomNavigation.tsx`.

---

## 6. Выполнение Definition of Done

- [x] Создана RPC функция `get_discovery_feed(limit INT DEFAULT 20)`.
- [x] Реализована формула расчета балла `score` (0–100) и `reasons`.
- [x] Собственные желания пользователя исключены из вывода (`w.user_id <> auth.uid()`).
- [x] Соблюдена приватность кругов через `can_view_profile(profile_id, 'WISHLIST')`.
- [x] Создан фронтенд модуль `src/features/discovery/` (карточки и лента).
- [x] Добавлен маршрут `/discover` и вкладка в `BottomNavigation.tsx`.
- [x] `npm run typecheck` — 0 ошибок.
- [x] `npm run build` — Успешная сборка за 3.00с.
- [x] Создан отчёт `SPRINT_5_AUDIT.md`.
