-- AlterTable
ALTER TABLE "User"
ADD COLUMN "countrySuggestionDismissedCountryId" TEXT,
ADD COLUMN "countrySuggestionDismissedUntil" TIMESTAMP(3);
