import { request } from '@/lib/api/client';

export type StudentAssignmentStatus = 'Not started' | 'In progress' | 'Submitted' | 'Expired';
export type QuestionType = 'single' | 'multiple' | 'true-false' | 'short-answer' | 'essay';

export type StudentQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  answer?: string;
  correctAnswer?: string | string[];
  explanation?: string;
};

export type StudentTest = {
  id: string;
  title: string;
  description: string;
  group: string;
  teacher: string;
  questions: StudentQuestion[];
  durationMinutes: number;
  totalPoints: number;
  deadline: string;
  status: StudentAssignmentStatus;
  isLocked: boolean;
  canReview: boolean;
  attemptsLeft: number;
  assignedAt: string;
  submittedAt?: string;
  score?: number;
  maxScore?: number;
  progress: number;
  questionCount: number;
};

export type StudentHistoryItem = {
  id: string;
  title: string;
  group?: string;
  teacher: string;
  submittedAt: string;
  score: number;
  maxScore: number;
  status: string;
};

export async function getStudentAssignment(id: string) {
  const response = await request<StudentTest>(`/students/tests/${id}`);
  return response.data ?? undefined;
}

export async function getDashboardAssignments() {
  const response = await request<StudentTest[]>('/students/tests');
  return (response.data ?? []).filter((assignment) => assignment.status !== 'Submitted');
}

export async function getRecentResults() {
  const response = await request<StudentHistoryItem[]>('/students/history');
  return (response.data ?? []).slice(0, 3);
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
