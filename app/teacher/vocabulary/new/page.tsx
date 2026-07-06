'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/app/components/AppHeader';
import { teacherApi } from '@/lib/api/teacher';

export default function NewVocabularyPage() {
  const router = useRouter();
  const [title, setTitle] = useState('Bộ từ vựng mới');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên bộ từ.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await teacherApi.createVocabularySet({
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        level: level.trim(),
        status,
      });
      router.push('/teacher/vocabulary');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được bộ từ vựng');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <AppHeader role="teacher" />
      <section className="container">
        <div className="page-head">
          <div>
            <div className="eyebrow">Vocabulary</div>
            <h1>Tạo bộ từ vựng mới</h1>
            <p>Thiết lập thông tin bộ từ trước, sau đó thêm từng từ thủ công ở màn quản lý.</p>
          </div>
          <Link className="btn" href="/teacher/vocabulary">Thoát</Link>
        </div>

        <form className="manager-layout" onSubmit={submit}>
          <section className="card panel form">
            <div className="eyebrow">Thông tin chung</div>
            <label>Tên bộ từ<input className="input" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label>Mô tả<textarea className="textarea" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mô tả ngắn về mục tiêu hoặc phạm vi bộ từ" /></label>
            <div className="compact-fields">
              <label>Môn / chủ đề<input className="input" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Tiếng Anh, IELTS, Unit 1..." /></label>
              <label>Trình độ<input className="input" value={level} onChange={(event) => setLevel(event.target.value)} placeholder="A2, B1, lớp 8..." /></label>
            </div>
            <label>Trạng thái sau khi lưu<select className="select" value={status} onChange={(event) => setStatus(event.target.value as 'DRAFT' | 'PUBLISHED')}><option value="DRAFT">Lưu nháp</option><option value="PUBLISHED">Đăng bộ từ</option></select></label>
          </section>

          <aside className="card panel editor-panel">
            <div className="eyebrow">Xuất bản</div>
            <div className="quick-box" style={{ marginTop: 14 }}>
              <p><strong>{title || 'Chưa đặt tên'}</strong></p>
              <p>{subject || 'Chưa có chủ đề'} · {level || 'Chưa có trình độ'}</p>
              <p>Trạng thái: {status === 'PUBLISHED' ? 'Đã đăng' : 'Nháp'}</p>
            </div>
            {error ? <div className="error" style={{ marginTop: 14 }}>{error}</div> : null}
            <div className="actions" style={{ marginTop: 14 }}>
              <button className="btn primary" disabled={loading} type="submit">{loading ? 'Đang lưu...' : 'Tạo bộ từ'}</button>
              <Link className="btn" href="/teacher/vocabulary">Hủy</Link>
            </div>
          </aside>
        </form>
      </section>
    </main>
  );
}
