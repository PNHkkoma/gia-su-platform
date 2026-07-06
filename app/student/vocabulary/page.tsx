import Link from 'next/link';
import { AppHeader } from '@/app/components/AppHeader';

export default function StudentVocabularyPage() {
  return (
    <main>
      <AppHeader role="student" />
      <section className="container">
        <div className="page-head">
          <div>
            <div className="eyebrow">Vocabulary</div>
            <h1>Từ vựng của tôi</h1>
            <p>Xem các bộ từ vựng được giáo viên giao. Learning modes sẽ được thêm ở phase sau.</p>
          </div>
          <Link className="btn" href="/student/dashboard">Quay lại dashboard</Link>
        </div>

        <section className="card panel">
          <div className="eyebrow">Phase 1</div>
          <h2>Chưa có bộ từ vựng được giao</h2>
          <p>Trang này đã sẵn sàng cho danh sách từ vựng của học sinh, nhưng chưa triển khai chế độ học.</p>
        </section>
      </section>
    </main>
  );
}
