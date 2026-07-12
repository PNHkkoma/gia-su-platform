CREATE TABLE IF NOT EXISTS "ExerciseAttempt" (
  "id" text PRIMARY KEY,
  "studentId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "exerciseId" text NOT NULL REFERENCES "GrammarExercise"("id") ON DELETE CASCADE,
  "selectedOptionId" text NULL,
  "answerPayload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "isCorrect" boolean NOT NULL,
  "score" integer NOT NULL DEFAULT 0,
  "maxScore" integer NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'SUBMITTED',
  "createdAt" timestamp(3) NOT NULL DEFAULT current_timestamp,
  "updatedAt" timestamp(3) NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS "ExerciseAttempt_student_exercise_idx" ON "ExerciseAttempt"("studentId", "exerciseId");
CREATE INDEX IF NOT EXISTS "ExerciseAttempt_exercise_idx" ON "ExerciseAttempt"("exerciseId");