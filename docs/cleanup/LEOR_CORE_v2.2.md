# LEOR_CORE_v2.2.md — Архитектурное и Продуктовое Ядро Leor

**Версия ядра**: 2.2  
**Статус**: Frozen Core (Спецификация и Архитектура)  
**Единственный Источник Истины**: [`docs/product/PRODUCT_SPEC_v2.1_FROZEN.md`](file:///d:/Projects/Leor/docs/product/PRODUCT_SPEC_v2.1_FROZEN.md)

---

## 1. Продуктовая Философия Leor

Leor — это личная карта человека для его близкого круга.

Главная цель Leor — создавать инфраструктуру понимания между людьми, чтобы каждый подарок был личным, точным и эмоционально ценным.

Leor помогает людям:
1. **Глубже понимать друг друга** — сохраняя вкусы, интересы, мечты, размеры и особенности жизни человека.
2. **Дарить точные и желанные подарки** — убирая случайность и неловкость.
3. **Сохранять теплые воспоминания** — фиксируя историю подарков и совместных моментов.

> **Главный принцип**:  
> Подарок — это не вещь. Подарок — это понимание человека.  
> Leor помогает дарить внимание, а не просто вещи.

---

## 2. Неприкосновенные Принципы Leor Core

1. **Сначала человек, потом подарок**: Центральной сущностью системы является **Gift Profile**. Все остальные модули (Wishlist, Circles, Taste Graph, Discovery, Memories) служат только тому, чтобы лучше понимать человека.
2. **Никакого социального шума**: В Leor нет и никогда не будет лайков, комментариев, подписчиков, публичных рейтингов, искусственных алгоритмических лент и числовой оценки дружбы.
3. **Никакой математизации и геймификации отношений**: Дружба не является KPI для оптимизации. В продукте запрещены любые "проценты связи", "оценки близости", "метрики пассивности общения" или назойливые уведомления-импульсы.
4. **Приватность по умолчанию**: Пользователь на 100% контролирует свои данные. Разграничение доступа осуществляется на уровне секций через `CircleAccess`.
5. **Единый источник истины (Single Source of Truth)**: Каждый тип данных хранится только в одном месте:
   - Размеры — в `profile_sizes`.
   - Интересы — в `taste_items`.
   - Граф предпочтений — в `taste_graph_nodes` и `taste_graph_edges`.
   - Желания — в `wishes`.
   - Бронирования — в `gift_reservations`.
   - История подарков — в `memories`.
   - Права доступа — в `circle_accesses`.
   Дублирование данных категорически запрещено.

---

## 3. Архитектурное Ядро (8 Неприкосновенных Доменов)

```text
Leor Core Data Flow
User
 ↓
Gift Profile (Размеры, Интересы, Вкусы, Мечты, Сейчас важно, Анти-подарки)
 ↓
Wishlist (Карточки желаний с авто-подстановкой размеров)
 ↓
Circle (Круги доверия и разграничение секций доступа)
 ↓
Gift Reservations (Скрытое бронирование с таймером 72 часа, 0 утечек получателю)
 ↓
Memories (История врученных подарков и совместных воспоминаний)

[ Фоновый слой рекомендаций ]
 └── Taste Graph & Discovery Feed (Персональные идеи подарков на основе совпадения графа)
```

### Доменная карта:
1. **Auth & Identity Domain**: Идентификация Telegram WebApp, Telegram Auth Guard, профили пользователей.
2. **Gift Profile Domain**: Личная карта человека (`gift_profiles`, `profile_sizes`, `taste_items`, `current_focuses`, `anti_gift_preferences`).
3. **Circle Domain**: Приватные круги близких людей (`circles`, `circle_members`, `circle_accesses`).
4. **Wishlist Domain**: Управление карточками желаний (`wishes`).
5. **Gift Reservation Domain**: Скрытое детерминированное бронирование подарков (`gift_reservations`).
6. **Taste Graph Domain**: Фоновый граф предпочтений человека (`taste_graph_nodes`, `taste_graph_edges`).
7. **Discovery Feed Domain**: Персональные рекомендации и идеи подарков для близких на основе Taste Graph.
8. **Memories Domain**: Совместные воспоминания и история врученных подарков (`memories`, `memory_participants`, `memory_media`).

---

## 4. Результаты Очистки (Cleanup Audit)

В рамках перехода к **Leor Core v2.2** из кодовой базы и СУБД **полностью удалены**:
- **Удаленные таблицы СУБД**: `relationship_scores`, `relationship_events`, `relationship_milestones`, `lifecycle_notifications`, `relationship_activity_metrics`.
- **Удаленные RPC процедуры**: `calculate_relationship_strength`, `rebuild_relationship_scores`, `get_relationship_summary`, `get_relationship_timeline_v2`, `get_relationship_journal`, `calculate_relationship_anniversary`, `get_relationship_activity`, `get_upcoming_relationship_events`, `detect_relationship_inactivity`.
- **Удаленные фронтенд-модули**: `src/features/relationship/`, `src/features/relationship-timeline/`, `src/features/lifecycle/`.

---

## 5. Статус Проекта

Продукт Leor v2.2 очищен от любого архитектурного переусложнения, 100% соответствует спецификации `PRODUCT_SPEC_v2.1_FROZEN.md` и полностью готов к бета-тестированию.
