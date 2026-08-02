# SPRINT_5_1_AUDIT.md — Аудит реализации Sprint 5.1 (Discovery Hardening)

Этот документ содержит полный технический и архитектурный аудит результатов разработки **Sprint 5.1 (Discovery Hardening)** проекта **Secret Circle (Leor)**.

---

## 1. Обзор Sprint 5.1

Sprint 5.1 укрепляет движок рекомендаций **Gift Discovery Engine** без изменения контрактов фронтенда, продуктовой модели или добавления сторонних AI сервисов:
- **Диверсификация Выдачи (Recommendation Diversity)**: Ограничено преобладание одной категории (не более 3 подряд) и одного владельца (не более 2 подряд) через оконные функции PostgreSQL.
- **Усиленный Графовый Расчет (Graph Similarity Hardening)**: Нормализованы веса узлов (`node_weight`), сила связей (`edge_strength`) и приоритет желания (`priority_weight`).
- **Свежесть Подарков (Freshness Boost)**: Новые карточки желаний (созданные в течение последних 14 дней) получают динамический бонус до `+10%` к итоговому баллу соответствия (`score`).
- **Баланс Кругов (Circle Balance)**: Использование оконных функций `ROW_NUMBER() OVER (PARTITION BY owner_id)` гарантирует равномерное распределение идей среди друзей из всех совместных кругов пользователя.
- **Стабильная Сортировка (Stable Ordering)**: Устранена случайность при равных баллах (`score DESC`, `freshness_boost DESC`, `created_at DESC`).
- **Улучшенные Объяснения (Explainability)**: Массив `reasons` содержит строго до 3 уникальных, приоритезированных причин (*Бренд* &rarr; *Категория* &rarr; *Taste Graph* &rarr; *Участник круга*).
- **Производительность (Performance)**: Добавлены составные индексы `idx_wishes_user_status_created` и `idx_circle_members_user_circle`.

---

## 2. Формула Балла и Свежести (Scoring & Freshness)

Итоговый балл соответствия `score` вычисляется по формуле:

$$\text{score} = \min\left(100, \text{round}\left((\text{node\_weight} \times 0.5 + \text{edge\_strength} \times 0.3 + \text{priority\_weight} \times 0.2) \times 100 + \text{freshness\_boost}\right)\right)$$

Где `freshness_boost` вычисляется как:
$$\text{freshness\_boost} = \min\left(10.0, \max\left(0, \frac{14 - \text{days\_old}}{14} \times 10.0\right)\right)$$

---

## 3. SQL Схема и Индексы (`20260805000002_sprint_5_1_discovery_hardening.sql`)

```sql
CREATE INDEX IF NOT EXISTS idx_wishes_user_status_created ON public.wishes(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_circle_members_user_circle ON public.circle_members(user_id, circle_id);
```

---

## 4. Выполнение Definition of Done

- [x] Связи и диверсификация строятся автоматически (максимум 3 на категорию, 2 на владельца).
- [x] Сила связей и `score` нормализованы с добавлением Freshness Boost (до +10%).
- [x] Используются оконные функции для дедупликации и баланса кругов.
- [x] Ограничен вывод причин `reasons` до 3 без дубликатов.
- [x] Добавлены индексы `idx_wishes_user_status_created` и `idx_circle_members_user_circle`.
- [x] `npm run typecheck` — 0 ошибок.
- [x] `npm run build` — Успешная сборка за 3.00с.
- [x] Создан отчёт `SPRINT_5_1_AUDIT.md`.
