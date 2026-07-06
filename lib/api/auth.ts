import { request } from './client';

export const authApi = {
  login: (email: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: { email: string; password: string; fullName: string; role: string }) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  refresh: (token: string) =>
    request('/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
};
