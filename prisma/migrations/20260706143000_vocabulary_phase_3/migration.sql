-- AlterTable
ALTER TABLE "VocabularyAssignment"
ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Vocabulary assignment',
ADD COLUMN "deadline" TIMESTAMP(3),
ADD COLUMN "dailyTarget" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN "requiredMasteryPercent" INTEGER NOT NULL DEFAULT 80;
