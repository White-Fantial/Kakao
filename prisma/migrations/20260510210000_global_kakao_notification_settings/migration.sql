-- AlterTable
ALTER TABLE "User"
ADD COLUMN "notifyOnKakaoForSearchAlert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "notifyOnKakaoForComment" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SearchAlert"
DROP COLUMN "notifyOnKakao";
