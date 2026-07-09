create table if not exists "FoundationCourse" (
  "id" text primary key,
  "teacherId" text not null references "User"("id"),
  "title" text not null,
  "description" text,
  "slug" text not null unique,
  "status" text not null default 'DRAFT',
  "level" text,
  "estimatedMinutes" integer not null default 0,
  "completionRule" text not null default 'COMPLETE_ALL_LESSONS',
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp
);

create table if not exists "FoundationUnit" (
  "id" text primary key,
  "courseId" text not null references "FoundationCourse"("id") on delete cascade,
  "title" text not null,
  "description" text,
  "orderIndex" integer not null default 0,
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp
);

create table if not exists "FoundationLesson" (
  "id" text primary key,
  "unitId" text not null references "FoundationUnit"("id") on delete cascade,
  "title" text not null,
  "content" text,
  "status" text not null default 'DRAFT',
  "orderIndex" integer not null default 0,
  "estimatedMinutes" integer not null default 10,
  "completionCondition" text not null default 'MARK_AS_DONE',
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default current_timestamp
);

create table if not exists "FoundationLessonProgress" (
  "id" text primary key,
  "studentId" text not null references "User"("id"),
  "courseId" text not null references "FoundationCourse"("id") on delete cascade,
  "lessonId" text not null references "FoundationLesson"("id") on delete cascade,
  "status" text not null default 'IN_PROGRESS',
  "startedAt" timestamp(3) not null default current_timestamp,
  "completedAt" timestamp(3),
  "updatedAt" timestamp(3) not null default current_timestamp,
  constraint "FoundationLessonProgress_student_lesson_key" unique ("studentId", "lessonId")
);

create index if not exists "FoundationCourse_teacher_idx" on "FoundationCourse"("teacherId");
create index if not exists "FoundationUnit_course_order_idx" on "FoundationUnit"("courseId", "orderIndex");
create index if not exists "FoundationLesson_unit_order_idx" on "FoundationLesson"("unitId", "orderIndex");
create index if not exists "FoundationLessonProgress_student_course_idx" on "FoundationLessonProgress"("studentId", "courseId");
