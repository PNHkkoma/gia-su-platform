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
  getTest: (slug: string) => request('/teachers/tests/' + slug),
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

  getVocabularySets: () => request('/teachers/vocabulary'),
  getVocabularyAudience: () => request('/teachers/vocabulary/audience'),
  getVocabularySet: (slug: string) => request('/teachers/vocabulary/' + slug),
  getVocabularyItems: (slug: string, params?: { page?: number; pageSize?: number; query?: string }) => {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.pageSize) search.set('pageSize', String(params.pageSize));
    if (params?.query) search.set('query', params.query);
    const suffix = search.size ? `?${search.toString()}` : '';
    return request(`/teachers/vocabulary/${slug}/items${suffix}`);
  },
  getVocabularyAssignments: (slug: string) => request(`/teachers/vocabulary/${slug}/assignments`),
  createVocabularySet: (payload: Record<string, unknown>) =>
    request('/teachers/vocabulary', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateVocabularySet: (slug: string, payload: Record<string, unknown>) =>
    request(`/teachers/vocabulary/${slug}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  createVocabularyItem: (slug: string, payload: Record<string, unknown>) =>
    request(`/teachers/vocabulary/${slug}/items`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateVocabularyItem: (slug: string, itemId: string, payload: Record<string, unknown>) =>
    request(`/teachers/vocabulary/${slug}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  createVocabularyAssignments: (slug: string, payload: Record<string, unknown>) =>
    request(`/teachers/vocabulary/${slug}/assignments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteVocabularyItem: (slug: string, itemId: string) =>
    request(`/teachers/vocabulary/${slug}/items/${itemId}`, {
      method: 'DELETE',
    }),

  getQuestions: () => request('/teachers/questions'),
  createQuestion: (payload: Record<string, unknown>) =>
    request('/teachers/questions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
