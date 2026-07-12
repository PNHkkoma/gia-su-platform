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
  getGrammarMiniQuiz: (blockId: string, studentEmail?: string) =>
    request(withStudentQuery(`/students/foundation-blocks/${blockId}/grammar-mini-quiz`, studentEmail)),
  startGrammarMiniQuiz: (quizId: string, studentEmail?: string) =>
    request(withStudentQuery(`/students/grammar-mini-quizzes/${quizId}/start`, studentEmail), { method: 'POST', body: JSON.stringify(studentEmail ? { studentEmail } : {}) }),
  autosaveGrammarMiniQuiz: (attemptId: string, answers: Record<string, unknown>) =>
    request(`/students/grammar-mini-quiz-attempts/${attemptId}/autosave`, { method: 'PATCH', body: JSON.stringify({ answers }) }),
  submitGrammarMiniQuiz: (attemptId: string, answers: Record<string, unknown>) =>
    request(`/students/grammar-mini-quiz-attempts/${attemptId}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  submitGrammarExercise: (exerciseId: string, payload: Record<string, unknown>, studentEmail?: string) =>
    request(withStudentQuery(`/students/grammar-exercises/${exerciseId}/submit`, studentEmail), {
      method: 'POST',
      body: JSON.stringify(studentEmail ? { ...payload, studentEmail } : payload),
    }),

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
