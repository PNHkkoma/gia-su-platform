'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppHeader } from '@/app/components/AppHeader';
import { teacherApi } from '@/lib/api/teacher';

type TestItem = { title: string; slug: string; status: string; durationMinutes?: number; questionCount?: number; attemptCount?: number };
type Dashboard = { classCount: number; studentCount: number; openTestCount: number; tests: TestItem[] };

export default function TeacherDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    teacherApi.getDashboard()
      .then((res) => setData(res.data as Dashboard))
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được dashboard'));
  }, []);

  const tests = data?.tests ?? [];

  return (
    <main>
      <AppHeader role="teacher" />
      <section className="container">
        <div className="card panel hero-card">
          <div className="row">
            <div>
              <div className="eyebrow">Teacher dashboard</div>
              <h1>Xin chào, giáo viên</h1>
              <p>Quản lý lớp, bài kiểm tra và kết quả học sinh trong một nơi.</p>
            </div>
            <div className="actions">
              <Link className="btn" href="/teacher/tests">Bài kiểm tra</Link>
              <Link className="btn primary" href="/teacher/tests/new">Tạo bài mới</Link>
            </div>
          </div>
          {error ? <div className="error">{error}</div> : null}
          <div className="stat-grid">
            <div className="card stat-card"><span>Tổng số lớp</span><strong>{data?.classCount ?? 0}</strong></div>
            <div className="card stat-card"><span>Học sinh</span><strong>{data?.studentCount ?? 0}</strong></div>
            <div className="card stat-card"><span>Bài test mở</span><strong>{data?.openTestCount ?? tests.length}</strong></div>
          </div>
        </div>

        <div className="dashboard-layout" style={{ marginTop: 18 }}>
          <section className="card panel">
            <div className="row">
              <div>
                <div className="eyebrow">Hoạt động gần đây</div>
                <h2>Bài kiểm tra trong hệ thống</h2>
              </div>
              <Link className="btn primary" href="/teacher/tests/new">Tạo bài mới</Link>
            </div>
            <div className="list">
              {tests.map((test) => (
                <article className="card list-item" key={test.slug}>
                  <div>
                    <h3>{test.title}</h3>
                    <div className="meta">
                      <span>{test.status}</span>
                      <span>{test.durationMinutes ?? 40} phút</span>
                      <span>{test.questionCount ?? 0} câu</span>
                      <span>{test.attemptCount ?? 0} lượt làm</span>
                    </div>
                  </div>
                  <Link className="btn" href="/teacher/tests">Quản lý</Link>
                </article>
              ))}
              {!error && tests.length === 0 ? <div className="notice">Chưa có dữ liệu hoặc backend chưa chạy.</div> : null}
            </div>
          </section>

          <aside className="card panel">
            <div className="eyebrow">Đồng bộ dữ liệu</div>
            <div className="quick-box" style={{ marginTop: 16 }}>
              <p>Dashboard, danh sách giáo viên và danh sách học sinh đều đang đọc từ database. Học sinh chỉ thấy bài có trạng thái đã đăng.</p>
            </div>
            <div className="card panel side-note" style={{ marginTop: 14 }}>
              <div className="eyebrow">Gợi ý tiếp theo</div>
              <p>Nếu bài đang là nháp, hãy đăng bài ở màn danh sách bài kiểm tra để học sinh nhìn thấy.</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
