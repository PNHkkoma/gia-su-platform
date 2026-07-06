import Link from 'next/link';
import { AppHeader } from '@/app/components/AppHeader';

export default function NewVocabularyPage() {
  return (
    <main>
      <AppHeader role="teacher" />
      <section className="container">
        <div className="page-head">
          <div>
            <div className="eyebrow">Vocabulary</div>
            <h1>Tạo bộ từ vựng mới</h1>
            <p>Form tạo bộ từ vựng sẽ được triển khai ở phase tiếp theo.</p>
          </div>
          <Link className="btn" href="/teacher/vocabulary">Thoát</Link>
        </div>

        <section className="card panel">
          <div className="eyebrow">Phase 1</div>
          <h2>Trang tạo bộ từ vựng</h2>
          <p>Đã tạo route và khung giao diện theo style hiện có. Chưa có learning modes hoặc logic lưu dữ liệu.</p>
        </section>
      </section>
    </main>
  );
}
