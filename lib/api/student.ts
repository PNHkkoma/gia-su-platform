import { request } from './client';

export const studentApi = {
  getTests: () => request('/students/tests'),
  getTest: (testId: string) => request(`/students/tests/${testId}`),
  getHistory: () => request('/students/history'),
  getProfile: () => request('/students/profile'),
  startTest: (testId: string) => request(`/students/tests/${testId}/start`, { method: 'POST' }),
  submitTest: (testId: string, payload: Record<string, unknown>) =>
    request(`/students/tests/${testId}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
