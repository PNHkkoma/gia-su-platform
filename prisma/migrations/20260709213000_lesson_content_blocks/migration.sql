create table if not exists "FoundationLessonBlock" (
  "id" text primary key,
  "lessonId" text not null references "FoundationLesson"("id") on delete cascade,
  "type" text not null default 'TEXT',
  "content" text not null default '',
  "orderIndex" integer not null default 0,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp
);

create index if not exists "FoundationLessonBlock_lesson_order_idx" on "FoundationLessonBlock"("lessonId", "orderIndex");
