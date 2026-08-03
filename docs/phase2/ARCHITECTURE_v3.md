# ARCHITECTURE_v3.md — Системная Архитектура Phase 2 (Leor)

Документ содержит полное техническое описание обновленной архитектуры **Phase 2 (v3.0)** СУБД, доменов данных, потоков взаимодействия и слоев безопасности платформы **Secret Circle (Leor)**.

---

## 1. Карта Доменов Продукта (Domain Map v3)

```mermaid
graph TD
    subgraph Core Domain
        GP[Gift Profile]
        U[Users]
        PS[Profile Sizes]
    end

    subgraph Social Domain
        C[Circles]
        CM[Circle Members]
        CA[Circle Accesses]
    end

    subgraph Wishlist & Reservation Domain
        W[Wishes]
        GR[Gift Reservations]
        GPASS[Group Pool Allocations]
    end

    subgraph Taste Domain
        TI[Taste Items]
        TGN[Taste Graph Nodes]
        TGE[Taste Graph Edges]
    end

    subgraph Memories Domain
        M[Memories]
        MP[Memory Participants]
        MM[Memory Media]
    end

    subgraph Relationship Intelligence Domain (NEW)
        RS[Relationship Scores]
        RE[Relationship Events]
        GA[Gift Affinities]
    end

    GP --> U
    C --> CM
    W --> GP
    GR --> W
    GPASS --> GR
    TGN --> U
    M --> U
    MP --> M
    RS --> U
    GA --> TGN
    GA --> W
    RS --> RE
```

---

## 2. Междоменное Взаимодействие (Inter-Domain Data Flow)

```text
+-------------------+       +-------------------+       +-------------------+
|   Gift Profile    | <---> |    Taste Graph    | <---> |     Wishlist      |
+-------------------+       +-------------------+       +-------------------+
          ^                           ^                           ^
          |                           |                           |
          v                           v                           v
+-------------------+       +-------------------+       +-------------------+
|  Public Shares    | <---> |     Memories      | <---> |   Relationship    |
|   (Share Layer)   |       |    (Timeline)     |       |   Intelligence    |
+-------------------+       +-------------------+       +-------------------+
```

### Потоки данных:
1. **Taste Graph ↔ Wishlist**: При создании/изменении желания срабатывает триггер `trg_wishes_rebuild_taste_graph`, синхронизирующий узлы категорий и брендов.
2. **Wishlist ↔ Memories**: При подтверждении подарка (`status = 'CONFIRMED'`) автоматический триггер формирует запись в `memories` с типом `GIFT`.
3. **Memories ↔ Relationship Intelligence**: Участие пользователей в совместных воспоминаниях и подарках увеличивает показатели `interaction_score` и `memory_affinity`.
4. **Taste Graph ↔ Relationship Intelligence**: Пересечение предпочтений двух пользователей вычисляет косинусное сходство векторов их графов вкусов (`gift_affinity`).

---

## 3. Архитектура RLS (Row Level Security v3)

Все новые таблицы **Relationship Intelligence Domain** находятся под строгой защитой RLS PostgreSQL:

### 3.1. `public.relationship_scores`
- `SELECT`: Разрешен **только** двум участникам пары (`auth.uid() IN (user_a_id, user_b_id)`).
- `INSERT/UPDATE/DELETE`: Блокируются для прямого клиентского взаимодействия, производятся строго через функции с атрибутом `SECURITY DEFINER`.

### 3.2. `public.relationship_events`
- `SELECT`: Разрешен только участникам соответствующей связи (`auth.uid() IN (user_a_id, user_b_id)`).

### 3.3. `public.gift_affinities`
- `SELECT`: Доступен пользователям, имеющим право просмотра профиля через `can_view_profile(target_profile_id, 'WISHLIST')`.

---

## 4. RPC Архитектура v3

Все аналитические функции выполняются асинхронно или по требованию с гарантией изолированности поиска (`SET search_path = public`):

1. **`recalculate_relationship_scores(p_user_a UUID, p_user_b UUID)`**:
   - Пересчитывает компоненты `interaction_score`, `gift_affinity`, `memory_affinity` и итоговый `strength_score`.
2. **`get_relationship_insights(p_target_profile_id UUID)`**:
   - Возвращает агрегированную аналитику отношений текущего пользователя с владелец профиля (совпадающие вкусы, история совместных подарков, памятные даты).
3. **`get_group_gift_pool(p_wish_id UUID)`**:
   - Безопасно возвращает прогресс группового сбора на подарок для участников круга, скрывая информацию от владельца желания (`w.user_id <> auth.uid()`).

---

## 5. Storage & Realtime Архитектура

### 5.1. Хранилище (Supabase Storage Buckets)
- `avatar-images` (Публичный) &rarr; Аватары пользователей и кругов.
- `wish-images` (Публичный) &rarr; Изображения желаний.
- `memory-images` (Публичный) &rarr; Фотографии обложек и галерей воспоминаний.

### 5.2. Realtime Подписки
- Клиенты подписываются на изменения в `gift_reservations` и `relationship_events` для мгновенного обновления статусов бронирований и появления совместных событий без постоянного опроса сервера (polling).
