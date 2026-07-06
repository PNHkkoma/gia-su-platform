import { request } from '@/lib/api/client';
import type { StudentTest } from '@/lib/student-data';

export async function getPublishedStudentTests(): Promise<StudentTest[]> {
  const response = await request<StudentTest[]>('/students/tests');
  return response.data ?? [];
}

export async function getPublishedStudentTest(slug: string) {
  const response = await request<StudentTest>(`/students/tests/${slug}`);
  return response.data ?? undefined;
}
