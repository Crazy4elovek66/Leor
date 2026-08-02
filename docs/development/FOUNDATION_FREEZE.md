# FOUNDATION_FREEZE.md — Официальная Заморозка Фундамента (Sprint 1.2)

Этот документ фиксирует официальное завершение и архитектурную заморозку фундамента **Secret Circle (Leor)** по итогам спринтов 1, 1.1 и 1.2.

---

## 1. Зафиксированная Архитектура Проекта (Frozen Architecture)

### 1.1. Инфраструктура (100% Free Tier)
- **Frontend**: React 19, Vite 7, TypeScript 5.9+, Tailwind CSS v4, React Router 7, TanStack Query 5, Zustand.
- **Backend (Supabase)**: Supabase PostgreSQL 16, Supabase Auth, Supabase Storage, Supabase Edge Functions (Deno).
- **Исключенные технологии**: Полный запрет на NestJS, Prisma, Redis, BullMQ, Docker или собственные серверы.

### 1.2. Структура Репозитория
```text
Leor/
├── src/                      # Frontend приложения (React 19)
├── supabase/                 # Infrastructure, migrations & edge functions
├── public/                   # Статические веб-ресурсы
├── docs/                     # Единственное место хранения всей документации
│   ├── architecture/         # Схема БД и архитектура
│   ├── product/              # Продуктовая спецификация и бэклог
│   ├── development/          # Стандарты разработки, планы и Freeze-документ
│   └── design/               # Дизайн-система и рекомендации
└── vercel.json               # SPA rewrites
```

---

## 2. Финальные Принципы RLS и Секционной Приватности

 Все таблицы БД защищены Row Level Security (RLS). Доступ разграничен явно по типам операций:

1. **`SELECT`**: Проверяет право просмотра через `can_view_profile(profile_id, 'SECTION')`.
   - Поддерживаемые секции: `BASIC_INFO`, `INTERESTS`, `SIZES`, `WISHLIST`, `MEMORIES`.
2. **`INSERT`**: Проверяет право создания через `WITH CHECK (can_view_profile(profile_id))` или `WITH CHECK (auth.uid() = user_id)`.
3. **`UPDATE`**: Проверяет право обновления через `USING (can_view_profile(profile_id)) WITH CHECK (can_view_profile(profile_id))`.
4. **`DELETE`**: Проверяет право удаления через `USING (can_view_profile(profile_id))`.

### Функция контроля доступа:
```sql
CREATE OR REPLACE FUNCTION public.can_view_profile(
  p_profile_id UUID,
  p_section TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_owner_user_id UUID;
BEGIN
  SELECT user_id INTO v_owner_user_id FROM public.gift_profiles WHERE id = p_profile_id;
  IF v_owner_user_id IS NOT NULL AND v_owner_user_id = auth.uid() THEN
    RETURN TRUE;
  END IF;
  IF public.check_circle_access(p_profile_id, p_section) THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;
```

---

## 3. Правила Расширения Sprint 2 (Sprint 2 Extension Rules)

1. **Не изменять существующие таблицы без миграции**: Любые изменения схем `users`, `gift_profiles`, `profile_sizes`, `taste_items` выполняются исключительно через новые SQL-файлы в `supabase/migrations/`.
2. **Не изменять ENUM без версии схемы**: Изменение значений `visibility_level`, `size_category`, `taste_category` допускается только при согласовании новой версии спецификации.
3. **Сохранять сигнатуру `can_view_profile`**: Функция `can_view_profile(profile_id, section)` является неизменяемым интерфейсом RLS. Система Кругов (Sprint 2) расширяет только внутреннюю реализацию `check_circle_access`.
4. **Добавление Кругов только через новые таблицы**: Таблицы `circles`, `circle_members`, `circle_accesses` добавляются как изолированные сущности.
5. **Источник правды для размеров**: Wishlist (Sprint 2) **не хранит** размеры пользователя, а ссылается на `profile_sizes` в `gift_profiles`.

---

## 4. Список Неизменяемых Решений (Immutable Design Decisions)

- **Названия БД в `snake_case`**: `users`, `gift_profiles`, `profile_sizes`, `taste_items`, `current_focuses`, `anti_gift_preferences`.
- **Дизайн-система**: Базовый фон `#0F0F10`, элементы `#17171A`, акцентная пыльная роза `#D8B4B0`, шрифт Inter/Manrope, язык интерфейса — строго русский.
- **Интеграция Telegram**: HMAC-SHA256 подпись Telegram `initData` валидируется только внутри бессерверных Edge Functions с проверкой `auth_date` (TTL <= 24 ч).
- **Хранение документации**: Вся документация размещается строго в папке `docs/`.
