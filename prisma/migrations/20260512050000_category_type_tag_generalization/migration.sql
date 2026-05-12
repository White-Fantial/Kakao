-- Normalize CategoryType enum and migrate HELP data
ALTER TABLE "Category" ALTER COLUMN "type" DROP DEFAULT;
UPDATE "Category" SET "type" = 'QUESTION' WHERE "type" = 'HELP';

CREATE TYPE "CategoryType_new" AS ENUM (
  'GENERAL',
  'QUESTION',
  'SALE',
  'GIVEAWAY',
  'RECRUIT',
  'HOUSING',
  'SERVICE',
  'EVENT',
  'NOTICE'
);

ALTER TABLE "Category"
  ALTER COLUMN "type" TYPE "CategoryType_new"
  USING ("type"::text::"CategoryType_new");

ALTER TABLE "PostTagOption" ADD COLUMN "categoryType" "CategoryType_new";

UPDATE "PostTagOption" pto
SET "categoryType" = c."type"
FROM "Category" c
WHERE c."id" = pto."categoryId";

UPDATE "PostTagOption"
SET "categoryType" = 'GENERAL'
WHERE "categoryType" IS NULL;

ALTER TABLE "PostTagOption" ALTER COLUMN "categoryType" SET NOT NULL;

ALTER TYPE "CategoryType" RENAME TO "CategoryType_old";
ALTER TYPE "CategoryType_new" RENAME TO "CategoryType";
DROP TYPE "CategoryType_old";

ALTER TABLE "Category" ALTER COLUMN "type" SET DEFAULT 'GENERAL';

-- Introduce many-to-many post tags
CREATE TABLE "PostTag" (
  "postId" TEXT NOT NULL,
  "postTagOptionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostTag_pkey" PRIMARY KEY ("postId", "postTagOptionId")
);

INSERT INTO "PostTag" ("postId", "postTagOptionId", "createdAt")
SELECT "id", "postTagOptionId", CURRENT_TIMESTAMP
FROM "Post"
WHERE "postTagOptionId" IS NOT NULL
ON CONFLICT ("postId", "postTagOptionId") DO NOTHING;

-- Deduplicate type+slug before adding new unique constraints
WITH ranked AS (
  SELECT
    id,
    "categoryType",
    slug,
    FIRST_VALUE(id) OVER (
      PARTITION BY "categoryType", slug
      ORDER BY "isActive" DESC, "sortOrder" ASC, "createdAt" ASC, id ASC
    ) AS keep_id,
    ROW_NUMBER() OVER (
      PARTITION BY "categoryType", slug
      ORDER BY "isActive" DESC, "sortOrder" ASC, "createdAt" ASC, id ASC
    ) AS rn
  FROM "PostTagOption"
), dups AS (
  SELECT id, keep_id
  FROM ranked
  WHERE rn > 1
)
UPDATE "PostTag" pt
SET "postTagOptionId" = d.keep_id
FROM dups d
WHERE pt."postTagOptionId" = d.id;

WITH ranked AS (
  SELECT
    id,
    "categoryType",
    slug,
    ROW_NUMBER() OVER (
      PARTITION BY "categoryType", slug
      ORDER BY "isActive" DESC, "sortOrder" ASC, "createdAt" ASC, id ASC
    ) AS rn
  FROM "PostTagOption"
)
DELETE FROM "PostTagOption" pto
USING ranked r
WHERE pto.id = r.id AND r.rn > 1;

-- Deduplicate type+label before adding new unique constraints
WITH ranked AS (
  SELECT
    id,
    "categoryType",
    label,
    FIRST_VALUE(id) OVER (
      PARTITION BY "categoryType", label
      ORDER BY "isActive" DESC, "sortOrder" ASC, "createdAt" ASC, id ASC
    ) AS keep_id,
    ROW_NUMBER() OVER (
      PARTITION BY "categoryType", label
      ORDER BY "isActive" DESC, "sortOrder" ASC, "createdAt" ASC, id ASC
    ) AS rn
  FROM "PostTagOption"
), dups AS (
  SELECT id, keep_id
  FROM ranked
  WHERE rn > 1
)
UPDATE "PostTag" pt
SET "postTagOptionId" = d.keep_id
FROM dups d
WHERE pt."postTagOptionId" = d.id;

WITH ranked AS (
  SELECT
    id,
    "categoryType",
    label,
    ROW_NUMBER() OVER (
      PARTITION BY "categoryType", label
      ORDER BY "isActive" DESC, "sortOrder" ASC, "createdAt" ASC, id ASC
    ) AS rn
  FROM "PostTagOption"
)
DELETE FROM "PostTagOption" pto
USING ranked r
WHERE pto.id = r.id AND r.rn > 1;

-- Clean up old single-tag relation
ALTER TABLE "Post" DROP CONSTRAINT IF EXISTS "Post_postTagOptionId_fkey";
DROP INDEX IF EXISTS "Post_postTagOptionId_createdAt_idx";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "postTagOptionId";

ALTER TABLE "PostTagOption" DROP CONSTRAINT IF EXISTS "PostTagOption_categoryId_fkey";
DROP INDEX IF EXISTS "PostTagOption_categoryId_slug_key";
DROP INDEX IF EXISTS "PostTagOption_categoryId_isActive_sortOrder_idx";
ALTER TABLE "PostTagOption" DROP COLUMN IF EXISTS "categoryId";
ALTER TABLE "PostTagOption" DROP COLUMN IF EXISTS "isDefault";

CREATE UNIQUE INDEX "PostTagOption_categoryType_label_key" ON "PostTagOption"("categoryType", "label");
CREATE UNIQUE INDEX "PostTagOption_categoryType_slug_key" ON "PostTagOption"("categoryType", "slug");
CREATE INDEX "PostTagOption_categoryType_isActive_sortOrder_idx" ON "PostTagOption"("categoryType", "isActive", "sortOrder");
CREATE INDEX "PostTag_postTagOptionId_createdAt_idx" ON "PostTag"("postTagOptionId", "createdAt");

ALTER TABLE "PostTag"
  ADD CONSTRAINT "PostTag_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PostTag"
  ADD CONSTRAINT "PostTag_postTagOptionId_fkey"
  FOREIGN KEY ("postTagOptionId") REFERENCES "PostTagOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
