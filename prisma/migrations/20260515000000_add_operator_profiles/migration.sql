-- CreateEnum
CREATE TYPE "DisplayAuthorType" AS ENUM ('USER', 'OPERATOR_PROFILE');

-- CreateTable
CREATE TABLE "OperatorProfile" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperatorProfile_slug_key" ON "OperatorProfile"("slug");

-- CreateIndex
CREATE INDEX "OperatorProfile_isActive_idx" ON "OperatorProfile"("isActive");

-- AlterTable
ALTER TABLE "Post" ADD COLUMN "displayAuthorType" "DisplayAuthorType" NOT NULL DEFAULT 'USER';
ALTER TABLE "Post" ADD COLUMN "displayAuthorId" TEXT;
