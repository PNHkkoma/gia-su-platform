'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppHeader } from '@/app/components/AppHeader';
import { studentApi } from '@/lib/api/student';

type StudentTest = { id: string; title: string; description: string; teacher: string; durationMinutes: number; questionCount: number; progress?: number; deadline?: string };

export default function StudentDashboardPage() {
  const [tests, setTests] = useState<StudentTest[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    studentApi.getTests()
      .then((res) => setTests((res.data as StudentTest[]) ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được bài kiểm tra'));
  }, []);

  return (
    <main>
      <AppHeader role="student" />
      <section className="container">
        <div className="dashboard-layout">
          <section className="card panel">
            <div className="row">
              <div>
                <div className="eyebrow">Danh sách nhiệm vụ</div>
                <h1>Bài kiểm tra hiện tại</h1>
              </div>
              <div className="actions"><Link className="btn" href="/student/foundation">Foundation</Link><Link className="btn" href="/student/tests">Xem tất cả</Link></div>
            </div>
            {error ? <div className="error">{error}</div> : null}
            <div className="list">
              {tests.slice(0, 3).map((test) => (
                <Link className="card list-item" href="/student/tests" key={test.id}>
                  <div>
                    <h3>{test.title}</h3>
                    <p>{test.description}</p>
                    <div className="meta">
                      <span>{test.teacher}</span>
                      <span>{test.durationMinutes} phút</span>
                      <span>{test.questionCount} câu</span>
                    </div>
                  </div>
                  <span className="badge">{test.progress ? 'Đang làm' : 'Chưa bắt đầu'}</span>
                </Link>
              ))}
              {!error && tests.length === 0 ? <div className="notice">Chưa có bài kiểm tra hoặc backend chưa chạy.</div> : null}
            </div>
          </section>

          <aside className="card panel">
            <div className="eyebrow">Kết quả gần đây</div>
            <div className="quick-box" style={{ marginTop: 16 }}>
              <h3>Chưa có bài đã chấm</h3>
              <p>Kết quả sẽ xuất hiện ở đây sau khi giáo viên bật hiển thị điểm.</p>
            </div>
            <div className="card panel side-note" style={{ marginTop: 14 }}>
              <div className="eyebrow">Mẹo hoàn thành</div>
              <p>Bắt đầu với câu dễ nhất trước, kiểm tra lại đáp án và nộp bài trước khi hết giờ.</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
