# RELATIONSHIP_INTELLIGENCE_SPEC.md — Спецификация Интеллекта Отношений (Phase 2)

Документ представляет собой исчерпывающую техническую спецификацию домена **Relationship Intelligence** платформы **Secret Circle (Leor)**.

---

## 1. Модель Отношений (Relationship Model)

Отношения между двумя пользователями $A$ и $B$ моделируются как нестираемая парная связь с каноническим порядком ключей:
$$\text{user\_a\_id} < \text{user\_b\_id}$$

Это гарантирует наличие ровно одной записи СУБД для каждой уникальной пары взаимодействующих пользователей.

---

## 2. Формула Расчёта Силы Отношений (Strength Score)

Итоговый показатель силы отношений $S \in [0, 100]$ вычисляется детерминированно:

$$S = \min\left(100, \text{round}\left(0.35 \times I + 0.35 \times G + 0.30 \times M\right)\right)$$

Где:
- **$I$ (Interaction Score)** — Индекс социального взаимодействия:
  $$I = \min\left(100, N_{\text{shared\_circles}} \times 25 + N_{\text{granted\_accesses}} \times 15\right)$$
- **$G$ (Gift Affinity Score)** — Индекс подарочной близости:
  $$G = \min\left(100, N_{\text{confirmed\_gifts}} \times 30 + N_{\text{reserved\_gifts}} \times 15 + \text{TasteSimilarity} \times 40\right)$$
- **$M$ (Memory Affinity Score)** — Индекс общей памяти:
  $$M = \min\left(100, N_{\text{joint\_memories}} \times 20 + N_{\text{joint\_photos}} \times 5\right)$$

### Расчёт Совпадения Вкусов (TasteSimilarity)
Вычисляется как нормализованное косинусное сходство между векторами узлов Taste Graph пользователей $A$ и $B$:

$$\text{TasteSimilarity} = \frac{\sum_{k} (w_{A, k} \times w_{B, k})}{\sqrt{\sum_{k} w_{A, k}^2} \times \sqrt{\sum_{k} w_{B, k}^2}}$$

---

## 3. Timeline Intelligence (Интеллект Календаря)

Система автоматически генерирует события в `relationship_events` при наступлении следующих условий:
1. **Предстоящий День Рождения** &rarr; За 14 дней до `birth_date`.
2. **Годовщина Совместной Памяти** &rarr; В день наступления памятного события прошлого года.
3. **Исполнение Желания** &rarr; В момент подтверждения бронирования `status = 'CONFIRMED'`.

---

## 4. Модель Приватности (Privacy Model)

1. **Строгая Изоляция**: Значения `relationship_scores` доступны только двум пользователям, входящим в пару.
2. **Защита Получателя**: Получатель подарка **не имеет доступа** к промежуточным показателям `gift_affinity`, рассчитываемым на основе его неисполненных желаний.

---

## 5. SQL Сущности

### 5.1. Таблица `public.relationship_scores`
```sql
CREATE TABLE IF NOT EXISTS public.relationship_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  strength_score INT NOT NULL DEFAULT 0 CONSTRAINT chk_strength_range CHECK (strength_score BETWEEN 0 AND 100),
  interaction_score INT NOT NULL DEFAULT 0 CONSTRAINT chk_interaction_range CHECK (interaction_score BETWEEN 0 AND 100),
  gift_affinity INT NOT NULL DEFAULT 0 CONSTRAINT chk_gift_affinity_range CHECK (gift_affinity BETWEEN 0 AND 100),
  memory_affinity INT NOT NULL DEFAULT 0 CONSTRAINT chk_memory_affinity_range CHECK (memory_affinity BETWEEN 0 AND 100),
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_pair UNIQUE (user_a_id, user_b_id),
  CONSTRAINT chk_user_order CHECK (user_a_id < user_b_id)
);
```

### 5.2. Таблица `public.relationship_events`
```sql
CREATE TABLE IF NOT EXISTS public.relationship_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 6. RPC Функции и API Контракты

### 6.1. `get_relationship_score(p_target_user_id UUID)`
```sql
CREATE OR REPLACE FUNCTION public.get_relationship_score(p_target_user_id UUID)
RETURNS JSONB AS $$
-- Возвращает расчитанные показатели силы отношений текущего auth.uid() и целевого пользователя
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
```

**Контракт ответа:**
```json
{
  "target_user_id": "uuid",
  "strength_score": 85,
  "interaction_score": 90,
  "gift_affinity": 80,
  "memory_affinity": 85,
  "common_interests_count": 6,
  "joint_memories_count": 4,
  "last_calculated_at": "2026-08-03T03:40:00Z"
}
```
