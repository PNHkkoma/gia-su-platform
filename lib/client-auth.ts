export type ClientAuthUser = {
  id: string;
  email: string;
  fullName?: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
};

const AUTH_STORAGE_KEY = 'golden-pony-auth-user';

export function saveClientAuthUser(user: ClientAuthUser) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function getClientAuthUser(): ClientAuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ClientAuthUser;
  } catch {
    return null;
  }
}

export function clearClientAuthUser() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
