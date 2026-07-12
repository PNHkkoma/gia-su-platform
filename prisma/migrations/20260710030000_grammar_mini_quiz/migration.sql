create table if not exists "GrammarMiniQuiz" (
  "id" text primary key,
  "lessonBlockId" text not null unique,
  "title" text not null default 'Grammar mini quiz',
  "passScore" double precision not null default 70,
  "maxAttempts" integer not null default 1,
  "showExplanationMode" text not null default 'AFTER_SUBMIT',
  "status" text not null default 'DRAFT',
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "GrammarMiniQuiz_lessonBlockId_fkey" foreign key ("lessonBlockId") references "FoundationLessonBlock"("id") on delete cascade
);

create table if not exists "GrammarMiniQuizItem" (
  "id" text primary key,
  "quizId" text not null,
  "exerciseId" text not null,
  "orderIndex" integer not null default 0,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "GrammarMiniQuizItem_quizId_fkey" foreign key ("quizId") references "GrammarMiniQuiz"("id") on delete cascade,
  constraint "GrammarMiniQuizItem_exerciseId_fkey" foreign key ("exerciseId") references "GrammarExercise"("id") on delete cascade
);

create unique index if not exists "GrammarMiniQuizItem_quizId_exerciseId_key" on "GrammarMiniQuizItem"("quizId", "exerciseId");
create index if not exists "GrammarMiniQuizItem_quizId_orderIndex_idx" on "GrammarMiniQuizItem"("quizId", "orderIndex");

create table if not exists "QuizAttempt" (
  "id" text primary key,
  "studentId" text not null,
  "quizId" text not null,
  "attemptNumber" integer not null default 1,
  "answers" jsonb not null default '{}'::jsonb,
  "score" double precision not null default 0,
  "maxScore" double precision not null default 0,
  "correctCount" integer not null default 0,
  "incorrectCount" integer not null default 0,
  "unansweredCount" integer not null default 0,
  "percentage" double precision not null default 0,
  "passed" boolean not null default false,
  "status" text not null default 'IN_PROGRESS',
  "startedAt" timestamp(3) not null default current_timestamp,
  "submittedAt" timestamp(3),
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "QuizAttempt_studentId_fkey" foreign key ("studentId") references "User"("id") on delete cascade,
  constraint "QuizAttempt_quizId_fkey" foreign key ("quizId") references "GrammarMiniQuiz"("id") on delete cascade
);

create index if not exists "QuizAttempt_studentId_quizId_idx" on "QuizAttempt"("studentId", "quizId");
create index if not exists "QuizAttempt_quizId_idx" on "QuizAttempt"("quizId");

alter table "ExerciseAttempt" add column if not exists "quizAttemptId" text;
alter table "ExerciseAttempt" add constraint "ExerciseAttempt_quizAttemptId_fkey" foreign key ("quizAttemptId") references "QuizAttempt"("id") on delete set null;
create index if not exists "ExerciseAttempt_quizAttemptId_idx" on "ExerciseAttempt"("quizAttemptId");