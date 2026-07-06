'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppHeader } from '@/app/components/AppHeader';
import { getClientAuthUser } from '@/lib/client-auth';
import { studentApi } from '@/lib/api/student';

type StudentVocabularyAssignment = {
  id: string;
  title: string;
  deadline?: string;
  dailyTarget: number;
  requiredMasteryPercent: number;
  assignedAt?: string;
  setTitle: string;
  setSlug: string;
  setDescription?: string;
  subject?: string;
  level?: string;
  teacherName?: string;
  className?: string;
  itemCount: number;
  targetType: 'CLASS' | 'STUDENT';
  status: string;
};

function formatDateTime(value?: string) {
  if (!value) return 'Khong co han';
  return new Date(value).toLocaleString('vi-VN');
}

export default function StudentVocabularyPage() {
  const [assignments, setAssignments] = useState<StudentVocabularyAssignment[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setError('');
        const user = getClientAuthUser();
        const res = await studentApi.getVocabulary(user?.email);
        setAssignments((res.data as StudentVocabularyAssignment[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Khong tai duoc danh sach tu vung');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main>
      <AppHeader role="student" />
      <section className="container">
        <div className="page-head">
          <div>
            <div className="eyebrow">Vocabulary</div>
            <h1>Tu vung cua toi</h1>
            <p>Xem cac bo tu vung duoc giao cho lop hoac giao truc tiep. Flashcard learning se duoc them o phase sau.</p>
          </div>
          <Link className="btn" href="/student/dashboard">Quay lai dashboard</Link>
        </div>

        {error ? <div className="error" style={{ marginBottom: 14 }}>{error}</div> : null}
        {loading ? <div className="notice">Dang tai bo tu vung duoc giao...</div> : null}

        <div className="list">
          {assignments.map((assignment) => (
            <article className="card panel student-vocabulary-card" key={assignment.id}>
              <div className="row student-vocabulary-head">
                <div>
                  <div className="eyebrow">{assignment.targetType === 'CLASS' ? 'Class Assignment' : 'Direct Assignment'}</div>
                  <h2>{assignment.title}</h2>
                </div>
                <span className="badge">{assignment.itemCount} tu</span>
              </div>
              <h3>{assignment.setTitle}</h3>
              <p>{assignment.setDescription || 'Bo tu vung da duoc giao de hoc theo tien do hang ngay.'}</p>
              <div className="meta">
                <span>Giao vien <strong>{assignment.teacherName || 'Chua ro'}</strong></span>
                {assignment.className ? <span>Lop <strong>{assignment.className}</strong></span> : null}
                {assignment.subject ? <span>Chu de <strong>{assignment.subject}</strong></span> : null}
                {assignment.level ? <span>Trinh do <strong>{assignment.level}</strong></span> : null}
                <span>Daily target <strong>{assignment.dailyTarget}</strong></span>
                <span>Mastery <strong>{assignment.requiredMasteryPercent}%</strong></span>
                <span>Deadline <strong>{formatDateTime(assignment.deadline)}</strong></span>
              </div>
            </article>
          ))}
          {!loading && assignments.length === 0 ? (
            <section className="card panel">
              <div className="eyebrow">Phase 3</div>
              <h2>Chua co bo tu vung duoc giao</h2>
              <p>Khi giao vien giao bo tu cho lop hoac giao truc tiep, danh sach se hien tai day.</p>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
