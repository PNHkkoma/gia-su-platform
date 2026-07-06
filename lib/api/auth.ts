import { request, type ApiResponse } from './client';

export type AuthUser = {
  id: string;
  email: string;
  fullName?: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
};

type LoginPayload = AuthUser | { user?: AuthUser };

function normalizeAuthResponse(response: ApiResponse<LoginPayload>): ApiResponse<AuthUser> {
  const data = response.data && 'user' in response.data ? response.data.user ?? null : response.data;
  return { ...response, data: data as AuthUser | null };
}

export const authApi = {
  login: async (email: string, password: string) =>
    normalizeAuthResponse(
      await request<LoginPayload>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
    ),

  register: async (payload: { email: string; password: string; fullName: string; role: string }) =>
    normalizeAuthResponse(
      await request<LoginPayload>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),

  logout: () =>
    request<null>('/auth/logout', {
      method: 'POST',
    }),

  refresh: (token: string) =>
    request<AuthUser>('/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
};
