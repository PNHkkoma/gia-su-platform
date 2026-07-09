'use client';

import Link from 'next/link';
import { BookOpen, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clearClientAuthUser } from '@/lib/client-auth';

export function AppHeader({ role = 'guest' }: { role?: 'guest' | 'teacher' | 'student' }) {
  const router = useRouter();
  const home = role === 'teacher' ? '/teacher/dashboard' : role === 'student' ? '/student/dashboard' : '/';

  function logout() {
    clearClientAuthUser();
    router.push('/auth/login');
  }

  return (
    <header className="topbar">
      <Link className="brand" href={home}>
        <span className="logo image-logo"><img alt="Golden pony" className="brand-logo-img" src="/golden-pony.png" /></span>
        <span className="brand-name">Golden pony</span>
      </Link>
      <nav className="nav" aria-label="Điều hướng chính">
        <Link className="btn soft" href={home}>
          <Home size={16} strokeWidth={2.2} />
          Trang chính
        </Link>
        {role === 'teacher' ? (
          <Link className="btn soft" href="/teacher/vocabulary">
            <BookOpen size={16} strokeWidth={2.2} />
            Vocabulary
          </Link>
        ) : null}
        {role === 'student' ? (
          <Link className="btn soft" href="/student/vocabulary">
            <BookOpen size={16} strokeWidth={2.2} />
            Vocabulary
          </Link>
        ) : null}
        {role !== 'guest' ? <span className="role-label">{role === 'teacher' ? 'Giáo viên' : 'Học sinh'}</span> : null}
        {role === 'guest' ? (
          <Link className="btn primary" href="/auth/login">Đăng nhập</Link>
        ) : (
          <button className="btn" onClick={logout}>Đăng xuất</button>
        )}
      </nav>
    </header>
  );
}
