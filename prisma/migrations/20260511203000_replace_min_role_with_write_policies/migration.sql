-- CreateEnum
CREATE TYPE "PermissionResourceType" AS ENUM ('CATEGORY', 'COUNTRY', 'CITY');

-- CreateEnum
CREATE TYPE "PermissionEffect" AS ENUM ('ALLOW', 'DENY');

-- CreateTable
CREATE TABLE "RoleWritePermissionPolicy" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "resourceType" "PermissionResourceType" NOT NULL,
    "resourceId" TEXT NOT NULL,
    "effect" "PermissionEffect" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleWritePermissionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWritePermissionPolicy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceType" "PermissionResourceType" NOT NULL,
    "resourceId" TEXT NOT NULL,
    "effect" "PermissionEffect" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWritePermissionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoleWritePermissionPolicy_role_resourceType_resourceId_key" ON "RoleWritePermissionPolicy"("role", "resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "RoleWritePermissionPolicy_resourceType_resourceId_idx" ON "RoleWritePermissionPolicy"("resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWritePermissionPolicy_userId_resourceType_resourceId_key" ON "UserWritePermissionPolicy"("userId", "resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "UserWritePermissionPolicy_resourceType_resourceId_idx" ON "UserWritePermissionPolicy"("resourceType", "resourceId");

-- Migrate existing category minRole restrictions into explicit role policies
INSERT INTO "RoleWritePermissionPolicy" ("id", "role", "resourceType", "resourceId", "effect", "createdAt", "updatedAt")
SELECT
  'migrated:' || c."id" || ':' || r.role,
  r.role::"UserRole",
  'CATEGORY'::"PermissionResourceType",
  c."id",
  (
    CASE
      WHEN c."minRole" = 'USER' THEN 'ALLOW'
      WHEN c."minRole" = 'COORDINATOR' AND r.role IN ('COORDINATOR', 'ADMIN') THEN 'ALLOW'
      WHEN c."minRole" = 'ADMIN' AND r.role = 'ADMIN' THEN 'ALLOW'
      ELSE 'DENY'
    END
  )::"PermissionEffect",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Category" c
CROSS JOIN (VALUES ('USER'), ('COORDINATOR'), ('ADMIN')) AS r(role);

-- Drop minRole from category
ALTER TABLE "Category" DROP COLUMN "minRole";

-- AddForeignKey
ALTER TABLE "UserWritePermissionPolicy" ADD CONSTRAINT "UserWritePermissionPolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
