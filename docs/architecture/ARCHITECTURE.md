# ARCHITECTURE.md

## Принцип архитектуры

Проект строится по принципу **Simple Feature Architecture**.

Без DDD.

Без Clean Architecture.

Без Repository Pattern.

Без избыточных слоев.

Каждая функция находится рядом со своими компонентами, хуками и API.

## Структура проекта

```text
src/
├── app/
├── providers/
├── router/
├── layouts/
├── features/
│   ├── auth/
│   ├── circle/
│   ├── wishlist/
│   ├── gifts/
│   ├── recommendations/
│   ├── profile/
│   └── settings/
├── components/
│   ├── ui/
│   └── common/
├── shared/
├── api/
├── lib/
├── hooks/
├── styles/
└── assets/
```

## Назначение папок

### app/

Инициализация приложения.

### providers/

Telegram SDK, React Query, тема.

### router/

Маршруты приложения.

### layouts/

Общие layout.

### features/

Основная бизнес-логика.

Каждая feature автономна.

Пример:

```text
features/wishlist/
├── components/
├── hooks/
├── api/
└── types.ts
```

### components/ui

shadcn/ui компоненты.

### components/common

Переиспользуемые компоненты проекта.

### shared

Общие типы, константы, модели.

### api

HTTP-клиент и общие запросы.

### lib

Telegram WebApp интеграция.

### hooks

Общие React hooks.

## Поток данных (Data Flow)

```text
Telegram WebApp
        ↓
     React UI
        ↓
   Feature Hooks
        ↓
     API Layer
        ↓
      Backend
        ↓
   PostgreSQL / Redis
```

UI не работает напрямую с сетью.

Все запросы проходят через feature hooks.

## Хранение состояния

### Локальное состояние

`useState`

### Серверное состояние

TanStack Query

### Глобальное состояние

Только если действительно необходимо.

Не создавать единый глобальный store.

## Коммуникация модулей

Разрешено:

- Feature → Shared
- Feature → Components
- Feature → API

Запрещено:

- Wishlist напрямую вызывает Gifts.
- Gifts напрямую вызывает Profile.

Связь только через API или shared.

## Основные сущности

- User
- Circle
- CircleMember
- Wishlist
- Wish
- GiftReservation
- Contribution
- Recommendation
- Memory
- Notification

## Anti-overengineering

### Не создавать

- фабрики;
- менеджеры;
- сервис-локаторы;
- универсальные репозитории;
- generic CRUD абстракции;
- event bus.

### Предпочитать

- прямой вызов функции;
- простой компонент;
- явную структуру.

### Правило

Если абстракция используется один раз — она не нужна.