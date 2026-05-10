-- AlterTable
ALTER TABLE "User"
ADD COLUMN "kakaoAccessToken" TEXT,
ADD COLUMN "kakaoAccessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "kakaoRefreshToken" TEXT;

-- CreateTable
CREATE TABLE "SearchAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "notifyOnKakao" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchAlert_userId_query_key" ON "SearchAlert"("userId", "query");

-- CreateIndex
CREATE INDEX "SearchAlert_userId_createdAt_idx" ON "SearchAlert"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "SearchAlert" ADD CONSTRAINT "SearchAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
