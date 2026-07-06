import { cookies } from 'next/headers';
import { verifyToken } from './jwt';

export type AuthUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;

  try {
    const payload = verifyToken<{ id: string; email: string; role: AuthUser['role'] }>(token);
    return { id: payload.id, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export async function requireUserRole(requiredRoles: AuthUser['role'][]) {
  const user = await getCurrentUser();
  if (!user || !requiredRoles.includes(user.role)) {
    throw new Response('Unauthorized', { status: 401 });
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
