import Link from 'next/link';
import { AppHeader } from '@/app/components/AppHeader';

export default function TeacherVocabularyPage() {
  return (
    <main>
      <AppHeader role="teacher" />
      <section className="container">
        <div className="page-head">
          <div>
            <div className="eyebrow">Vocabulary</div>
            <h1>Quản lý bộ từ vựng</h1>
            <p>Tạo và giao bộ từ vựng cho lớp hoặc từng học sinh. Learning modes sẽ được thêm ở phase sau.</p>
          </div>
          <div className="actions">
            <Link className="btn" href="/teacher/dashboard">Quay lại</Link>
            <Link className="btn primary" href="/teacher/vocabulary/new">Tạo bộ từ mới</Link>
          </div>
        </div>

        <section className="card panel">
          <div className="eyebrow">Phase 1</div>
          <h2>Chưa có bộ từ vựng</h2>
          <p>Trang này đã sẵn sàng cho luồng quản lý từ vựng, nhưng chưa triển khai tạo/sửa nội dung ở phase đầu tiên.</p>
        </section>
      </section>
    </main>
  );
}
