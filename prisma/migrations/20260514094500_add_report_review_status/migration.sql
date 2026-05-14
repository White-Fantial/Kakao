CREATE TYPE "ReportReviewStatus" AS ENUM ('PENDING', 'VALID', 'FALSE_REPORT');

ALTER TABLE "PostReport"
ADD COLUMN "reviewStatus" "ReportReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedById" TEXT;

ALTER TABLE "CommentReport"
ADD COLUMN "reviewStatus" "ReportReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedById" TEXT;

ALTER TABLE "PostReport"
ADD CONSTRAINT "PostReport_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommentReport"
ADD CONSTRAINT "CommentReport_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "PostReport_reviewStatus_createdAt_idx" ON "PostReport"("reviewStatus", "createdAt");
CREATE INDEX "CommentReport_reviewStatus_createdAt_idx" ON "CommentReport"("reviewStatus", "createdAt");
