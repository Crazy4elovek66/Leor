# DATABASE_SCHEMA.md

Version: 2.0

Database: PostgreSQL 16

ORM: Prisma 6

---

# Главный принцип

**Gift Profile принадлежит пользователю.**

Wishlist принадлежит пользователю.

Circle определяет доступ к данным пользователя.

Получается модель:

User

↓

Gift Profile

↓

Wishlist

↓

Circle Access

Это позволяет:

* состоять в нескольких кругах;
* показывать разные разделы профиля разным людям;
* делать публичный профиль;
* развивать Taste Graph независимо от Wishlist.

---

# ER Diagram

```text
User
├── GiftProfile
├── ProfileSize
├── TasteItem
├── CurrentFocus
├── AntiGiftPreference
├── Wish
├── CircleMember
├── GiftReservation
├── GiftFund
├── FundContribution
├── Memory
└── Notification

Circle
├── CircleMember
├── CircleAccess
├── Activity
└── Invitation

Wish
├── GiftReservation
├── GiftFund
└── Memory
```

---

# User

```prisma
model User {
id           String   @id @default(cuid())

telegramId   BigInt   @unique

username     String?

firstName    String

lastName     String?

avatarUrl    String?

createdAt    DateTime @default(now())

updatedAt    DateTime @updatedAt

profile      GiftProfile?

wishes       Wish[]

memberships  CircleMember[]

reservedGifts GiftReservation[] @relation("ReservationUser")

giftFunds     GiftFund[] @relation("FundCreator")

memoriesSent     Memory[] @relation("MemorySender")

memoriesReceived Memory[] @relation("MemoryReceiver")

notifications Notification[]
}

```

---

# GiftProfile

```prisma
model GiftProfile {
  id          String @id @default(cuid())

  userId      String @unique

  bio         String?

  birthDate   DateTime?

  city        String?

  user        User @relation(fields: [userId], references: [id])

  sizes       ProfileSize[]

  tastes      TasteItem[]

  focuses     CurrentFocus[]

  antiGifts   AntiGiftPreference[]

  createdAt   DateTime @default(now())

  updatedAt   DateTime @updatedAt
}
```

---

# ProfileSize

```prisma
model ProfileSize {
  id         String @id @default(cuid())

  profileId  String

  category   SizeCategory

  value      String

  visibility VisibilityLevel @default(CIRCLE)

  profile    GiftProfile @relation(fields: [profileId], references: [id])

  @@index([profileId, category])
}
```

SizeCategory:

CLOTHING_TOP

CLOTHING_BOTTOM

SHOES

RING

BRACELET

NECKLACE

---

# TasteItem

```prisma
model TasteItem {
  id          String @id @default(cuid())

  profileId   String

  category    TasteCategory

  title       String

  weight      Float @default(1)

  profile     GiftProfile @relation(fields: [profileId], references: [id])

  createdAt   DateTime @default(now())

  updatedAt   DateTime @updatedAt

  @@index([profileId, category])
}

```

TasteCategory:

MOVIES

BOOKS

GAMES

MUSIC

TRAVEL

STYLE

HOME

FOOD

SPORT

HOBBY

BRANDS

---

# CurrentFocus

```prisma
model CurrentFocus {
  id          String @id @default(cuid())

  profileId   String

  title       String

  isActive    Boolean @default(true)

  profile     GiftProfile @relation(fields: [profileId], references: [id])

  createdAt   DateTime @default(now())
}
```

Например:

учу английский.

делаю ремонт.

готовлюсь к свадьбе.

---

# AntiGiftPreference

```prisma
model AntiGiftPreference {
  id          String @id @default(cuid())

  profileId   String

  title       String

  profile     GiftProfile @relation(fields: [profileId], references: [id])
}
```

Например:

цветы.

алкоголь.

сертификаты.

---

# Circle

```prisma
model Circle {
  id          String @id @default(cuid())

  name        String

  avatarUrl   String?

  ownerId     String

  inviteCode  String @unique

  isArchived  Boolean @default(false)

  createdAt   DateTime @default(now())

  updatedAt   DateTime @updatedAt

  members     CircleMember[]

  accessRules CircleAccess[]
}
```

---

# CircleMember

```prisma
model CircleMember {
  id         String @id @default(cuid())

  circleId   String

  userId     String

  role       CircleRole @default(MEMBER)

  joinedAt   DateTime @default(now())

  @@unique([circleId, userId])

  @@index([userId])
}
```

---

# CircleAccess

Определяет,

какие разделы Gift Profile доступны конкретному кругу.

```prisma
model CircleAccess {
  id         String @id @default(cuid())

  circleId   String

  profileId  String

  section    ProfileSection

  @@unique([circleId, profileId, section])

  @@index([profileId])

  @@index([circleId])
}
```

ProfileSection:

SIZES

INTERESTS

DREAMS

CURRENT_FOCUS

ANTI_GIFTS

FAVORITES

---

# Wish

```prisma
model Wish {
id           String @id @default(cuid())

userId       String

user         User @relation(fields: [userId], references: [id])

title        String

description  String?

imageUrl     String?

link         String?

price        Decimal?

currency     String @default("RUB")

type         WishType

category     WishCategory?

priority     WishPriority @default(MEDIUM)

visibility   VisibilityLevel @default(CIRCLE)

status       WishStatus @default(ACTIVE)

context      String?

sizeOverride String?

createdAt    DateTime @default(now())

updatedAt    DateTime @updatedAt

reservation  GiftReservation?

fund         GiftFund?

memories     Memory[]

@@index([userId, status])

@@index([visibility])
}


```

---

# GiftReservation

```prisma
model GiftReservation {
id            String @id @default(cuid())

wishId        String @unique

reservedById  String

reservedBy    User @relation("ReservationUser", fields: [reservedById], references: [id])

status        ReservationStatus @default(ACTIVE)

reservedAt    DateTime @default(now())

confirmedAt   DateTime?

cancelledAt   DateTime?

expiresAt     DateTime?

@@index([reservedById])

@@index([status])
}

```

---

# GiftFund

```prisma
model GiftFund {
id            String @id @default(cuid())

wishId        String @unique

creatorId     String

creator       User @relation("FundCreator", fields: [creatorId], references: [id])

targetAmount  Decimal

currentAmount Decimal @default(0)

deadline      DateTime?

status        FundStatus @default(ACTIVE)

createdAt     DateTime @default(now())

updatedAt     DateTime @updatedAt

contributions FundContribution[]

@@index([status])

@@index([deadline])
}

```

---

# FundContribution

```prisma
model FundContribution {
  id         String @id @default(cuid())

  fundId     String

  userId     String

  amount     Decimal

  status     ContributionStatus @default(PLEDGED)

  createdAt  DateTime @default(now())

  @@index([fundId])

  @@index([userId])
}
```

---

# Memory

```prisma
model Memory {
id            String @id @default(cuid())

wishId        String?

giftedById    String

giftedBy      User @relation("MemorySender", fields: [giftedById], references: [id])

giftedToId    String

giftedTo      User @relation("MemoryReceiver", fields: [giftedToId], references: [id])

imageUrl      String?

note          String?

occasion      OccasionType?

giftedAt      DateTime

createdAt     DateTime @default(now())

@@index([giftedToId])

@@index([giftedById])

@@index([occasion])
}


```
```enum OccasionType {
BIRTHDAY
NEW_YEAR
ANNIVERSARY
JUST_BECAUSE
TRAVEL
GRADUATION
OTHER
}

```

Воспоминание может существовать **без Wishlist**.

Это важно для подарков вне списка.

---

# Notification

```prisma
model Notification {
id          String @id @default(cuid())

userId      String

user        User @relation(fields: [userId], references: [id])

type        NotificationType

title       String

body        String

isRead      Boolean @default(false)

scheduledAt DateTime?

sentAt      DateTime?

createdAt   DateTime @default(now())

@@index([userId, isRead])

@@index([scheduledAt])
}

```

---

# Activity

```prisma
model Activity {
  id         String @id @default(cuid())

  circleId   String

  actorId    String?

  type       ActivityType

  entityId   String?

  metadata   Json?

  createdAt  DateTime @default(now())

  @@index([circleId, createdAt])
}
```

---

# Visibility

```prisma
enum VisibilityLevel {
  PRIVATE
  CIRCLE
  SELECTED_CIRCLES
  PUBLIC
}
```

---

# Главные изменения v2

1. GiftProfile стал отдельной сущностью.

2. Размеры вынесены в отдельную таблицу.

3. Taste Graph хранится как TasteItem.

4. Появился CurrentFocus.

5. Появились AntiGiftPreference.

6. Circle управляет доступом к разделам профиля.

7. Wish больше не принадлежит Circle.

8. Memory может существовать без Wishlist.

Эта схема полностью соответствует новой философии Leor:

**сначала человек, потом его профиль, потом желания, потом подарки.**
