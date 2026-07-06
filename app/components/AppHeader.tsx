'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AppHeader({ role = 'guest' }: { role?: 'guest' | 'teacher' | 'student' }) {
  const router = useRouter();
  const home = role === 'teacher' ? '/teacher/dashboard' : role === 'student' ? '/student/dashboard' : '/';

  function logout() {
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
