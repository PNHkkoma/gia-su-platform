'use client';

import Link from 'next/link';
import { BookOpen, ClipboardList, Home } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { clearClientAuthUser } from '@/lib/client-auth';

export function AppHeader({ role = 'guest' }: { role?: 'guest' | 'teacher' | 'student' }) {
  const router = useRouter();
  const pathname = usePathname();
  const home = role === 'teacher' ? '/teacher/dashboard' : role === 'student' ? '/student/dashboard' : '/';
  const testsPath = role === 'teacher' ? '/teacher/tests' : role === 'student' ? '/student/tests' : '';
  const vocabularyPath = role === 'teacher' ? '/teacher/vocabulary' : role === 'student' ? '/student/vocabulary' : '';

  function navClass(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`) ? 'btn soft nav-active' : 'btn soft';
  }

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
        <Link className={navClass(home)} href={home}>
          <Home size={16} strokeWidth={2.2} />
          Trang chính
        </Link>
        {testsPath ? (
          <Link className={navClass(testsPath)} href={testsPath}>
            <ClipboardList size={16} strokeWidth={2.2} />
            Bài kiểm tra
          </Link>
        ) : null}
        {vocabularyPath ? (
          <Link className={navClass(vocabularyPath)} href={vocabularyPath}>
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
