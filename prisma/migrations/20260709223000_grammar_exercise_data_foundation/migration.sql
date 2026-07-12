DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GrammarExerciseType') THEN
    CREATE TYPE "GrammarExerciseType" AS ENUM (
      'SINGLE_CHOICE',
      'FILL_BLANK',
      'REORDER_WORDS',
      'MATCHING',
      'ERROR_CORRECTION',
      'SHORT_SENTENCE'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GrammarExerciseStatus') THEN
    CREATE TYPE "GrammarExerciseStatus" AS ENUM ('DRAFT', 'PUBLISHED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "GrammarExercise" (
  "id" text PRIMARY KEY,
  "lessonId" text NULL REFERENCES "FoundationLesson"("id") ON DELETE CASCADE,
  "lessonBlockId" text NULL REFERENCES "FoundationLessonBlock"("id") ON DELETE CASCADE,
  "type" "GrammarExerciseType" NOT NULL,
  "instruction" text NULL,
  "question" text NOT NULL,
  "explanation" text NULL,
  "hint" text NULL,
  "score" integer NOT NULL DEFAULT 1,
  "orderIndex" integer NOT NULL DEFAULT 0,
  "status" "GrammarExerciseStatus" NOT NULL DEFAULT 'DRAFT',
  "options" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "acceptedAnswers" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "matchingPairs" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "wordTokens" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "correctOrder" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" timestamp(3) NOT NULL DEFAULT current_timestamp,
  "updatedAt" timestamp(3) NOT NULL DEFAULT current_timestamp,
  CONSTRAINT "GrammarExercise_parent_check" CHECK (
    ("lessonId" IS NOT NULL AND "lessonBlockId" IS NULL)
    OR ("lessonId" IS NULL AND "lessonBlockId" IS NOT NULL)
  ),
  CONSTRAINT "GrammarExercise_score_check" CHECK ("score" >= 0)
);

CREATE INDEX IF NOT EXISTS "GrammarExercise_lesson_order_idx" ON "GrammarExercise"("lessonId", "orderIndex");
CREATE INDEX IF NOT EXISTS "GrammarExercise_block_order_idx" ON "GrammarExercise"("lessonBlockId", "orderIndex");