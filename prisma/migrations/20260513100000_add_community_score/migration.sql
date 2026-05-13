-- AddColumn communityScore to Post
ALTER TABLE "Post" ADD COLUMN "communityScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AddColumn communityScore to Comment
ALTER TABLE "Comment" ADD COLUMN "communityScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable CommunityScoreEvent
CREATE TABLE "CommunityScoreEvent" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "actorId" TEXT,
    "baseDelta" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "finalDelta" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityScoreEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityScoreEvent_targetType_targetId_createdAt_idx" ON "CommunityScoreEvent"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityScoreEvent_postId_createdAt_idx" ON "CommunityScoreEvent"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityScoreEvent_commentId_createdAt_idx" ON "CommunityScoreEvent"("commentId", "createdAt");

-- AddForeignKey
ALTER TABLE "CommunityScoreEvent" ADD CONSTRAINT "CommunityScoreEvent_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityScoreEvent" ADD CONSTRAINT "CommunityScoreEvent_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
