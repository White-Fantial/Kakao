CREATE TYPE "CategoryVisibilityMode" AS ENUM ('NORMAL', 'ALWAYS_INCLUDED', 'HIDDEN');
CREATE TYPE "PermissionSubjectType" AS ENUM ('USER', 'ROLE');

ALTER TABLE "Category"
  ADD COLUMN "visibilityMode" "CategoryVisibilityMode" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Category"
SET "visibilityMode" = CASE
  WHEN "isAlwaysIncluded" THEN 'ALWAYS_INCLUDED'::"CategoryVisibilityMode"
  ELSE 'NORMAL'::"CategoryVisibilityMode"
END;

ALTER TABLE "Category"
  DROP COLUMN "isAlwaysIncluded",
  DROP COLUMN "ignoreCity",
  DROP COLUMN "supportsAllCities",
  DROP COLUMN "ignoreCountry";

CREATE TABLE "PostPermission" (
  "id" TEXT NOT NULL,
  "subjectType" "PermissionSubjectType" NOT NULL,
  "userId" TEXT,
  "role" "UserRole",
  "countryId" TEXT,
  "cityId" TEXT,
  "categoryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostPermission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PostPermission_subjectType_userId_idx" ON "PostPermission"("subjectType", "userId");
CREATE INDEX "PostPermission_subjectType_role_idx" ON "PostPermission"("subjectType", "role");
CREATE INDEX "PostPermission_countryId_cityId_categoryId_idx" ON "PostPermission"("countryId", "cityId", "categoryId");

ALTER TABLE "PostPermission"
  ADD CONSTRAINT "PostPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PostPermission_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PostPermission_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PostPermission_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Post"
  ADD CONSTRAINT "Post_city_requires_country" CHECK ("cityId" IS NULL OR "countryId" IS NOT NULL);

ALTER TABLE "PostPermission"
  ADD CONSTRAINT "PostPermission_subject_fields_check" CHECK (
    (
      "subjectType" = 'USER'::"PermissionSubjectType"
      AND "userId" IS NOT NULL
      AND "role" IS NULL
    )
    OR (
      "subjectType" = 'ROLE'::"PermissionSubjectType"
      AND "role" IS NOT NULL
      AND "userId" IS NULL
    )
  ),
  ADD CONSTRAINT "PostPermission_city_requires_country" CHECK ("cityId" IS NULL OR "countryId" IS NOT NULL);

DROP TABLE "UserWritePermissionPolicy";
DROP TABLE "RoleWritePermissionPolicy";

DROP TYPE "PermissionEffect";
DROP TYPE "PermissionResourceType";
