import { request } from './client';

export const teacherApi = {
  getDashboard: (params = '') => request(`/teachers/dashboard${params}`),

  getClasses: () => request('/teachers/classes'),
  createClass: (payload: { name: string; subject: string; level: string }) =>
    request('/teachers/classes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getTests: () => request('/teachers/tests'),
  createTest: (payload: Record<string, unknown>) =>
    request('/teachers/tests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTest: (slug: string, payload: Record<string, unknown>) =>
    request(`/teachers/tests/${slug}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteTest: (slug: string) =>
    request(`/teachers/tests/${slug}`, {
      method: 'DELETE',
    }),

  getQuestions: () => request('/teachers/questions'),
  createQuestion: (payload: Record<string, unknown>) =>
    request('/teachers/questions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
