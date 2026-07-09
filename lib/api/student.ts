import { request } from './client';

function withStudentQuery(path: string, studentEmail?: string) {
  if (!studentEmail) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}studentEmail=${encodeURIComponent(studentEmail)}`;
}

export const studentApi = {
  getTests: (studentEmail?: string) => request(withStudentQuery('/students/tests', studentEmail)),
  getTest: (testId: string, studentEmail?: string) => request(withStudentQuery(`/students/tests/${testId}`, studentEmail)),
  getHistory: (studentEmail?: string) => request(withStudentQuery('/students/history', studentEmail)),
  getProfile: (studentEmail?: string) => request(withStudentQuery('/students/profile', studentEmail)),
  getFoundationCourses: (studentEmail?: string) => request(withStudentQuery('/students/foundation-courses', studentEmail)),
  getFoundationCourse: (slug: string, studentEmail?: string) => request(withStudentQuery(`/students/foundation-courses/${slug}`, studentEmail)),
  startFoundationLesson: (lessonId: string, studentEmail?: string) =>
    request(withStudentQuery(`/students/foundation-lessons/${lessonId}/start`, studentEmail), { method: 'POST' }),
  completeFoundationLesson: (lessonId: string, studentEmail?: string) =>
    request(withStudentQuery(`/students/foundation-lessons/${lessonId}/complete`, studentEmail), { method: 'POST' }),

  getVocabulary: (studentEmail?: string) => request(withStudentQuery('/students/vocabulary', studentEmail)),
  getVocabularyAssignment: (assignmentId: string, studentEmail?: string) => request(withStudentQuery(`/students/vocabulary/${assignmentId}`, studentEmail)),
  reviewVocabularyItem: (assignmentId: string, itemId: string, payload: Record<string, unknown>, studentEmail?: string) =>
    request(withStudentQuery(`/students/vocabulary/${assignmentId}/items/${itemId}/review`, studentEmail), {
      method: 'POST',
      body: JSON.stringify(studentEmail ? { ...payload, studentEmail } : payload),
    }),
  startTest: (testId: string, studentEmail?: string) => request(withStudentQuery(`/students/tests/${testId}/start`, studentEmail), { method: 'POST' }),
  submitTest: (testId: string, payload: Record<string, unknown>, studentEmail?: string) =>
    request(withStudentQuery(`/students/tests/${testId}/submit`, studentEmail), {
      method: 'POST',
      body: JSON.stringify(studentEmail ? { ...payload, studentEmail } : payload),
    }),
};
