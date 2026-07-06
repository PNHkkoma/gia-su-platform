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
  getVocabulary: (studentEmail?: string) => request(withStudentQuery('/students/vocabulary', studentEmail)),
  startTest: (testId: string, studentEmail?: string) => request(withStudentQuery(`/students/tests/${testId}/start`, studentEmail), { method: 'POST' }),
  submitTest: (testId: string, payload: Record<string, unknown>, studentEmail?: string) =>
    request(withStudentQuery(`/students/tests/${testId}/submit`, studentEmail), {
      method: 'POST',
      body: JSON.stringify(studentEmail ? { ...payload, studentEmail } : payload),
    }),
};
