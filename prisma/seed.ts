import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Teacher123!', 10);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      email: 'teacher@example.com',
      fullName: 'Gia sư Minh',
      passwordHash,
      role: 'TEACHER'
    }
  });

  const studentHash = await bcrypt.hash('Student123!', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      fullName: 'Học sinh Lan',
      passwordHash: studentHash,
      role: 'STUDENT'
    }
  });

  const klass = await prisma.class.upsert({
    where: { inviteCode: 'MATH-7K2P' },
    update: {},
    create: {
      teacherId: teacher.id,
      name: 'Toán 7 - Buổi tối',
      description: 'Lớp luyện kiểm tra Toán 7 dành cho học sinh cấp 2.',
      subject: 'Math',
      level: '7',
      inviteCode: 'MATH-7K2P'
    }
  });

  await prisma.classStudent.upsert({
    where: { classId_studentId: { classId: klass.id, studentId: student.id } },
    update: {},
    create: {
      classId: klass.id,
      studentId: student.id
    }
  });

  const question1 = await prisma.question.upsert({
    where: { id: 'q1' },
    update: {},
    create: {
      id: 'q1',
      ownerTeacherId: teacher.id,
      type: 'SINGLE_CHOICE',
      content: 'Số nào là nghiệm của phương trình x + 2 = 5?',
      subject: 'Math',
      topic: 'Algebra',
      difficulty: 'EASY',
      points: 1
    }
  });

  await prisma.questionOption.createMany({
    data: [
      { id: 'o1', questionId: question1.id, content: '2', isCorrect: false, orderIndex: 1 },
      { id: 'o2', questionId: question1.id, content: '3', isCorrect: true, orderIndex: 2 },
      { id: 'o3', questionId: question1.id, content: '4', isCorrect: false, orderIndex: 3 }
    ],
    skipDuplicates: true
  });

  const test = await prisma.test.upsert({
    where: { slug: 'kiem-tra-toan-7' },
    update: {},
    create: {
      teacherId: teacher.id,
      title: 'Kiểm tra Toán 7',
      description: 'Bài kiểm tra ngắn dành cho lớp Toán 7.',
      slug: 'kiem-tra-toan-7',
      status: 'PUBLISHED',
      durationMinutes: 40,
      maxAttempts: 1,
      passScore: 5,
      showResultMode: 'IMMEDIATE',
      showExplanation: true
    }
  });

  await prisma.testQuestion.upsert({
    where: { id: 'tq1' },
    update: {},
    create: {
      id: 'tq1',
      testId: test.id,
      questionId: question1.id,
      orderIndex: 1,
      pointsOverride: 1
    }
  });

  await prisma.testAssignment.upsert({
    where: { accessCode: 'MATH-7K2P' },
    update: {},
    create: {
      testId: test.id,
      classId: klass.id,
      accessCode: 'MATH-7K2P'
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
