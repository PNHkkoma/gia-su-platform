import Link from 'next/link';
import { AppHeader } from './components/AppHeader';

export default function HomePage() {
  return (
    <main>
      <AppHeader />
      <section className="container">
        <div className="grid two" style={{ alignItems: 'center' }}>
          <div>
            <div className="eyebrow">Lớp học vui vẻ</div>
            <h1>Golden pony</h1>
            <p>Nền tảng kiểm tra online sáng sủa cho giáo viên tạo bài, học sinh làm bài và xem kết quả rõ ràng.</p>
            <div className="actions">
              <Link className="btn primary" href="/auth/login">Đăng nhập</Link>
              <Link className="btn" href="/teacher/dashboard">Giáo viên</Link>
              <Link className="btn" href="/student/dashboard">Học sinh</Link>
            </div>
          </div>
          <div className="card panel mascot-panel">
            <img alt="Golden pony mascot" className="mascot-image" src="/golden-pony.png" />
          </div>
        </div>
      </section>
    </main>
  );
}
