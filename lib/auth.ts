import { authApi, type AuthUser } from '@/lib/api/auth';

const STORAGE_KEY = 'giasu.auth.user';

function readStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export async function loginWithEmail(email: string, password: string) {
  const response = await authApi.login(email, password);
  if (response.data && typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
  }
  return response;
}

export async function logout() {
  const response = await authApi.logout();
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return response;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  return readStoredUser();
}

export async function requireUserRole(requiredRoles: AuthUser['role'][]) {
  const user = await getCurrentUser();
  if (!user || !requiredRoles.includes(user.role)) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireTeacher() {
  return requireUserRole(['TEACHER', 'ADMIN']);
}

export async function requireStudent() {
  return requireUserRole(['STUDENT', 'ADMIN']);
}

export async function requireAdmin() {
  return requireUserRole(['ADMIN']);
}

export type { AuthUser };
