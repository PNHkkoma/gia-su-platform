'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';
import { saveClientAuthUser } from '@/lib/client-auth';

type RolePreset = {
  label: string;
  email: string;
  password: string;
  hint: string;
};

const presets: RolePreset[] = [
  {
    label: 'Giáo viên',
    email: 'teacher@example.com',
    password: 'Teacher123!',
    hint: 'Quản lý lớp, bài kiểm tra và kết quả học sinh.',
  },
  {
    label: 'Học sinh',
    email: 'student@example.com',
    password: 'Student123!',
    hint: 'Xem bài được giao, làm bài và theo dõi tiến độ.',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [activePreset, setActivePreset] = useState(0);
  const [email, setEmail] = useState(presets[0].email);
  const [password, setPassword] = useState(presets[0].password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function choosePreset(index: number) {
    setActivePreset(index);
    setEmail(presets[index].email);
    setPassword(presets[index].password);
    setError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(email.trim(), password);
      const data = response.data as { id?: string; email?: string; fullName?: string; role?: 'ADMIN' | 'TEACHER' | 'STUDENT' } | null;
      if (!data?.role || !data.email || !data.id) {
        throw new Error('Backend khong tra ve du thong tin nguoi dung.');
      }
      saveClientAuthUser({
        id: data.id,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
      });
      router.push(data.role === 'STUDENT' ? '/student/dashboard' : '/teacher/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-shell">
        <div className="login-brand-panel">
          <Link className="login-brand" href="/">
            <span className="login-logo image-logo"><img alt="Golden pony" className="brand-logo-img" src="/golden-pony.png" /></span>
            <span className="brand-name">Golden pony</span>
          </Link>
          <div>
            <p className="login-kicker">Lớp học vui vẻ</p>
            <h1>Học và kiểm tra cùng Golden pony.</h1>
            <p className="login-copy">Không gian kiểm tra sáng sủa, dễ dùng cho giáo viên và học sinh.</p>
          </div>
          <div className="login-info-grid">
            <div>
              <strong>Spring API</strong>
              <span>http://localhost:8080/api/v1</span>
            </div>
            <div>
              <strong>Frontend</strong>
              <span>Next.js app router</span>
            </div>
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-head">
            <p className="login-kicker">Đăng nhập</p>
            <h2>Chọn vai trò</h2>
          </div>

          <div className="role-switcher" aria-label="Chọn tài khoản mẫu">
            {presets.map((preset, index) => (
              <button
                className={index === activePreset ? 'role-option active' : 'role-option'}
                key={preset.label}
                onClick={() => choosePreset(index)}
                type="button"
              >
                <strong>{preset.label}</strong>
                <span>{preset.hint}</span>
              </button>
            ))}
          </div>

          <form className="login-form" onSubmit={submit}>
            <label>
              Email
              <input
                autoComplete="email"
                className="login-input"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </label>
            <label>
              Mật khẩu
              <input
                autoComplete="current-password"
                className="login-input"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>

            {error ? <div className="login-error">{error}</div> : null}

            <button className="login-submit" disabled={loading} type="submit">
              {loading ? 'Đang kiểm tra...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
