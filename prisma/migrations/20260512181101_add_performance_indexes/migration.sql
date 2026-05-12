-- Add index for fast status-based post queries (admin/coordinator pages)
CREATE INDEX "Post_status_createdAt_idx" ON "Post"("status", "createdAt" DESC);

-- Add index for fast per-author status-filtered queries (my/posts page)
CREATE INDEX "Post_authorId_status_createdAt_idx" ON "Post"("authorId", "status", "createdAt" DESC);

-- Replace Comment postId index with a narrower status-aware composite index.
-- The new index covers both the full-table postId+status+createdAt pattern and
-- the original postId+createdAt pattern (PostgreSQL can use a prefix of a composite index).
DROP INDEX "Comment_postId_createdAt_idx";
CREATE INDEX "Comment_postId_status_createdAt_idx" ON "Comment"("postId", "status", "createdAt" DESC);
