import Link from 'next/link';
import { AppHeader } from './components/AppHeader';

export default function HomePage() {
  return (
    <main>
      <AppHeader />
      <section className="container">
        <div className="grid two" style={{ alignItems: 'center' }}>
          <div>
            <div className="eyebrow">Nền tảng kiểm tra</div>
            <h1>Giáo Sư</h1>
            <p>Trang tạm đã được khôi phục để Next.js chạy lại với thư mục app. Các luồng chính có thể vào từ đây.</p>
            <div className="actions">
              <Link className="btn primary" href="/auth/login">Đăng nhập</Link>
              <Link className="btn" href="/teacher/dashboard">Giáo viên</Link>
              <Link className="btn" href="/student/dashboard">Học sinh</Link>
            </div>
          </div>
          <div className="card panel">
            <div className="eyebrow">Truy cập nhanh</div>
            <div className="list">
              <Link className="card list-item" href="/teacher/tests"><strong>Quản lý bài kiểm tra</strong></Link>
              <Link className="card list-item" href="/teacher/tests/new"><strong>Tạo bài mới</strong></Link>
              <Link className="card list-item" href="/student/tests"><strong>Danh sách bài của học sinh</strong></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
