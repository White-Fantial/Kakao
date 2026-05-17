ALTER TYPE "CategoryVisibilityMode" ADD VALUE IF NOT EXISTS 'OPERATOR_BOARD';
ALTER TYPE "CategoryVisibilityMode" ADD VALUE IF NOT EXISTS 'OPERATOR_NOTICE';

UPDATE "Category"
SET "visibilityMode" = CASE
  WHEN "type" = 'NOTICE' THEN 'OPERATOR_NOTICE'::"CategoryVisibilityMode"
  ELSE 'OPERATOR_BOARD'::"CategoryVisibilityMode"
END
WHERE "visibilityMode" = 'HIDDEN'::"CategoryVisibilityMode";
