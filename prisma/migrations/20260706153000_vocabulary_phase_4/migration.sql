-- AlterTable
ALTER TABLE "StudentVocabularyProgress"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'LEARNING',
ADD COLUMN "confidence" INTEGER NOT NULL DEFAULT 0;

-- Backfill from the phase 1 familiarity field so old progress still has a usable confidence value.
UPDATE "StudentVocabularyProgress"
SET "confidence" = COALESCE("confidence", "familiarity", 0),
    "status" = CASE
        WHEN COALESCE("familiarity", 0) >= 5 AND "correctCount" >= 3 THEN 'MASTERED'
        ELSE 'LEARNING'
    END;
