-- CreateEnum
CREATE TYPE "KakaoMessageDeliveryType" AS ENUM ('SEARCH_ALERT', 'COMMENT_NOTIFICATION');

-- CreateEnum
CREATE TYPE "KakaoMessageDeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "KakaoMessageDelivery" (
    "id" TEXT NOT NULL,
    "deliveryType" "KakaoMessageDeliveryType" NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "targetUrl" TEXT,
    "status" "KakaoMessageDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "relatedPostId" TEXT,
    "searchQuery" TEXT,
    "retriedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KakaoMessageDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KakaoMessageDelivery_status_createdAt_idx" ON "KakaoMessageDelivery"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "KakaoMessageDelivery_recipientUserId_createdAt_idx" ON "KakaoMessageDelivery"("recipientUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "KakaoMessageDelivery_deliveryType_createdAt_idx" ON "KakaoMessageDelivery"("deliveryType", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "KakaoMessageDelivery" ADD CONSTRAINT "KakaoMessageDelivery_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
