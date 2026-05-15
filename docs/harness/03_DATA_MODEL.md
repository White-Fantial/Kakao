# Data Model Draft

## Core Entities

### User
- id
- kakaoId
- displayName
- profileImageUrl
- kakaoContactUrl / openChatUrl
- role: USER | COORDINATOR | ADMIN
- status: ACTIVE | LIMITED | SUSPENDED | DELETED
- createdAt
- updatedAt

### City
- id
- name
- slug
- isActive
- sortOrder

### Category
- id
- name
- slug
- type: GENERAL | SALE | GIVEAWAY | HELP | QUESTION
- isActive
- sortOrder

### Post
- id
- authorId
- cityId
- categoryId
- title nullable
- body
- price nullable
- status: DRAFT | PUBLISHED | HELD | DELETED
- saleStatus: AVAILABLE | SOLD nullable
- heldReason nullable
- deletedReason nullable
- createdAt
- updatedAt
- publishedAt
- heldAt
- deletedAt

### PostImage
- id
- postId
- url
- provider
- providerPublicId nullable
- width nullable
- height nullable
- sortOrder
- createdAt

### Comment
- id
- postId
- authorId
- body
- status: PUBLISHED | HELD | DELETED
- createdAt
- updatedAt

### ModerationAction
- id
- actorId
- targetType: POST | COMMENT | USER
- targetId
- actionType:
  - HOLD_POST
  - RESTORE_POST
  - DELETE_POST
  - PIN_POST
  - UNPIN_POST
  - HOLD_COMMENT
  - DELETE_COMMENT
  - LIMIT_USER_REQUEST
  - LIMIT_USER
  - SUSPEND_USER
  - RESTORE_USER
- reason nullable
- createdAt

### UserRestriction
- id
- userId
- status: LIMITED | SUSPENDED
- reason
- createdById
- reviewedByAdminId nullable
- startsAt
- endsAt nullable
- createdAt

## Prisma Schema Draft

```prisma
enum UserRole {
  USER
  COORDINATOR
  ADMIN
}

enum UserStatus {
  ACTIVE
  LIMITED
  SUSPENDED
  DELETED
}

enum PostStatus {
  DRAFT
  PUBLISHED
  HELD
  DELETED
}

enum SaleStatus {
  AVAILABLE
  SOLD
}

enum CommentStatus {
  PUBLISHED
  HELD
  DELETED
}

enum CategoryType {
  GENERAL
  SALE
  GIVEAWAY
  HELP
  QUESTION
}

model User {
  id              String       @id @default(cuid())
  kakaoId         String       @unique
  displayName     String
  profileImageUrl String?
  openChatUrl     String?
  role            UserRole     @default(USER)
  status          UserStatus   @default(ACTIVE)
  posts           Post[]
  comments        Comment[]
  moderationLogs  ModerationAction[] @relation("ModerationActor")
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

model City {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  isActive  Boolean  @default(true)
  sortOrder Int      @default(0)
  posts     Post[]
}

model Category {
  id        String       @id @default(cuid())
  name      String
  slug      String       @unique
  type      CategoryType @default(GENERAL)
  isActive  Boolean      @default(true)
  sortOrder Int          @default(0)
  posts     Post[]
}

model Post {
  id            String       @id @default(cuid())
  authorId      String
  cityId        String
  categoryId    String
  title         String?
  body          String
  price         Decimal?     @db.Decimal(10, 2)
  status        PostStatus   @default(PUBLISHED)
  saleStatus    SaleStatus?
  heldReason    String?
  deletedReason String?
  author        User         @relation(fields: [authorId], references: [id])
  city          City         @relation(fields: [cityId], references: [id])
  category      Category     @relation(fields: [categoryId], references: [id])
  images        PostImage[]
  comments      Comment[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  publishedAt   DateTime?    @default(now())
  heldAt        DateTime?
  deletedAt     DateTime?

  @@index([cityId, categoryId, status, createdAt])
  @@index([authorId, createdAt])
}

model PostImage {
  id               String   @id @default(cuid())
  postId           String
  url              String
  provider         String
  providerPublicId String?
  width            Int?
  height           Int?
  sortOrder        Int      @default(0)
  post             Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  createdAt        DateTime @default(now())
}

model Comment {
  id        String        @id @default(cuid())
  postId    String
  authorId  String
  body      String
  status    CommentStatus @default(PUBLISHED)
  post      Post          @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    User          @relation(fields: [authorId], references: [id])
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  @@index([postId, createdAt])
}

model ModerationAction {
  id         String   @id @default(cuid())
  actorId    String
  targetType String
  targetId   String
  actionType String
  reason     String?
  actor      User     @relation("ModerationActor", fields: [actorId], references: [id])
  createdAt  DateTime @default(now())

  @@index([targetType, targetId, createdAt])
}

model UserRestriction {
  id                String     @id @default(cuid())
  userId            String
  status            UserStatus
  reason            String
  createdById        String
  reviewedByAdminId  String?
  startsAt          DateTime   @default(now())
  endsAt            DateTime?
  createdAt         DateTime   @default(now())

  @@index([userId, status])
}
```
