-- IMPORTANT: Take a DB backup before applying this migration in production.
-- Legacy operator-profile based display-author columns are removed in this migration.

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('REAL_USER', 'PERSONA', 'OPERATOR', 'SYSTEM');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "accountType" "AccountType" NOT NULL DEFAULT 'REAL_USER',
ADD COLUMN "isManagedAccount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "shortBio" TEXT,
ADD COLUMN "personaNotes" TEXT,
ADD COLUMN "toneNotes" TEXT,
ADD COLUMN "activityNotes" TEXT;

-- AlterTable
ALTER TABLE "Post"
ADD COLUMN "createdByUserId" TEXT;

-- AlterTable
ALTER TABLE "Comment"
ADD COLUMN "createdByUserId" TEXT;

-- Backfill author audit fields to preserve existing authorship data.
UPDATE "Post" SET "createdByUserId" = "authorId" WHERE "createdByUserId" IS NULL;
UPDATE "Comment" SET "createdByUserId" = "authorId" WHERE "createdByUserId" IS NULL;

-- Existing users remain REAL_USER by default (explicitly normalized).
UPDATE "User" SET "accountType" = 'REAL_USER' WHERE "accountType" IS NULL;

-- Drop legacy operator profile display-author columns.
ALTER TABLE "Post" DROP COLUMN "displayAuthorType";
ALTER TABLE "Post" DROP COLUMN "displayAuthorId";

-- Drop legacy operator profile table.
DROP TABLE "OperatorProfile";

-- DropEnum
DROP TYPE "DisplayAuthorType";

-- CreateIndex
CREATE INDEX "Post_createdByUserId_createdAt_idx" ON "Post"("createdByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_createdByUserId_createdAt_idx" ON "Comment"("createdByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "Post"
ADD CONSTRAINT "Post_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment"
ADD CONSTRAINT "Comment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
