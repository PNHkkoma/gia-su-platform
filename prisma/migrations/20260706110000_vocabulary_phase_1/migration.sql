-- CreateTable
CREATE TABLE "VocabularySet" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "subject" TEXT,
    "level" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularySet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyItem" (
    "id" TEXT NOT NULL,
    "vocabularySetId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "pronunciation" TEXT,
    "example" TEXT,
    "imageUrl" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyAssignment" (
    "id" TEXT NOT NULL,
    "vocabularySetId" TEXT NOT NULL,
    "classId" TEXT,
    "studentId" TEXT,
    "accessCode" TEXT,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VocabularyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentVocabularyProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "vocabularyItemId" TEXT NOT NULL,
    "familiarity" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentVocabularyProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VocabularySet_slug_key" ON "VocabularySet"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyAssignment_accessCode_key" ON "VocabularyAssignment"("accessCode");

-- CreateIndex
CREATE UNIQUE INDEX "StudentVocabularyProgress_studentId_vocabularyItemId_key" ON "StudentVocabularyProgress"("studentId", "vocabularyItemId");

-- AddForeignKey
ALTER TABLE "VocabularySet" ADD CONSTRAINT "VocabularySet_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyItem" ADD CONSTRAINT "VocabularyItem_vocabularySetId_fkey" FOREIGN KEY ("vocabularySetId") REFERENCES "VocabularySet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyAssignment" ADD CONSTRAINT "VocabularyAssignment_vocabularySetId_fkey" FOREIGN KEY ("vocabularySetId") REFERENCES "VocabularySet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyAssignment" ADD CONSTRAINT "VocabularyAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyAssignment" ADD CONSTRAINT "VocabularyAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentVocabularyProgress" ADD CONSTRAINT "StudentVocabularyProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentVocabularyProgress" ADD CONSTRAINT "StudentVocabularyProgress_vocabularyItemId_fkey" FOREIGN KEY ("vocabularyItemId") REFERENCES "VocabularyItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;