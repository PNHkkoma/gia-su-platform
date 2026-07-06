-- AlterTable
ALTER TABLE "VocabularyItem" ADD COLUMN "word" TEXT;
ALTER TABLE "VocabularyItem" ADD COLUMN "phonetic" TEXT;
ALTER TABLE "VocabularyItem" ADD COLUMN "partOfSpeech" TEXT;
ALTER TABLE "VocabularyItem" ADD COLUMN "meaningVi" TEXT;
ALTER TABLE "VocabularyItem" ADD COLUMN "meaningEn" TEXT;
ALTER TABLE "VocabularyItem" ADD COLUMN "exampleSentence" TEXT;
ALTER TABLE "VocabularyItem" ADD COLUMN "exampleMeaningVi" TEXT;
ALTER TABLE "VocabularyItem" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill Phase 1 fields into Phase 2 shape.
UPDATE "VocabularyItem"
SET "word" = COALESCE("word", "term"),
    "meaningVi" = COALESCE("meaningVi", "meaning"),
    "exampleSentence" = COALESCE("exampleSentence", "example");
