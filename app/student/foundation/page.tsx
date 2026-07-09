'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/app/components/AppHeader';
import { getClientAuthUser } from '@/lib/client-auth';
import { studentApi } from '@/lib/api/student';

type Lesson = { id: string; title: string; content?: string; progressStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'; estimatedMinutes: number; completionCondition: string };
type Unit = { id: string; title: string; description?: string; orderIndex: number; lessons?: Lesson[] };
type Course = { id: string; title: string; description?: string; slug: string; teacherName?: string; estimatedMinutes?: number; lessonCount?: number; completedLessonCount?: number; continueLessonId?: string | null; units?: Unit[] };

function statusText(status: string) {
  if (status === 'COMPLETED') return 'Đã hoàn thành';
  if (status === 'IN_PROGRESS') return 'Đang học';
  return 'Chưa học';
}

function flattenLessons(course: Course | null) {
  return (course?.units ?? []).flatMap((unit) => (unit.lessons ?? []).map((lesson) => ({ ...lesson, unitTitle: unit.title })));
}

export default function StudentFoundationPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [active, setActive] = useState<Course | null>(null);
  const [activeLessonId, setActiveLessonId] = useState('');
  const [error, setError] = useState('');
  const userEmail = getClientAuthUser()?.email;

  async function loadCourses(nextSlug?: string) {
    try {
      setError('');
      const res = await studentApi.getFoundationCourses(userEmail);
      const list = (res.data as Course[]) ?? [];
      setCourses(list);
      const slug = nextSlug || active?.slug || list[0]?.slug;
      if (slug) await openCourse(slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được lộ trình');
    }
  }

  async function openCourse(slug: string) {
    const res = await studentApi.getFoundationCourse(slug, userEmail);
    const course = res.data as Course | null;
    if (!course) throw new Error('Không tìm thấy khóa học');
    setActive(course);
    const lessons = flattenLessons(course);
    setActiveLessonId(course.continueLessonId || lessons[0]?.id || '');
  }

  useEffect(() => { loadCourses(); }, []);

  const lessons = useMemo(() => flattenLessons(active), [active]);
  const activeLesson = lessons.find((lesson) => lesson.id === activeLessonId) || lessons[0];
  const completed = active?.completedLessonCount ?? lessons.filter((lesson) => lesson.progressStatus === 'COMPLETED').length;
  const total = active?.lessonCount ?? lessons.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  async function startLesson(lessonId: string) {
    await studentApi.startFoundationLesson(lessonId, userEmail);
    if (active) await openCourse(active.slug);
    setActiveLessonId(lessonId);
  }

  async function completeLesson(lessonId: string) {
    await studentApi.completeFoundationLesson(lessonId, userEmail);
    if (active) await openCourse(active.slug);
    setActiveLessonId(lessonId);
  }

  return (
    <main>
      <AppHeader role="student" />
      <section className="container">
        <div className="page-head">
          <div><div className="eyebrow">Foundation Roadmap</div><h1>Lộ trình khóa học</h1><p>Xem Unit, Lesson, trạng thái học và tiếp tục từ bài gần nhất.</p></div>
          <Link className="btn" href="/student/dashboard">Quay lại dashboard</Link>
        </div>
        {error ? <div className="error">{error}</div> : null}

        <div className="teacher-manage-layout" style={{ marginTop: 18 }}>
          <aside className="test-list-panel">
            <div className="eyebrow">Khóa học published</div>
            {courses.map((course) => (
              <button className={active?.slug === course.slug ? 'test-list-button active' : 'test-list-button'} key={course.id} onClick={() => openCourse(course.slug)}>
                <strong>{course.title}</strong>
                <span className="meta">{course.completedLessonCount ?? 0}/{course.lessonCount ?? 0} lesson · {course.estimatedMinutes ?? 0} phút</span>
              </button>
            ))}
            {!courses.length ? <div className="notice">Chưa có khóa Foundation đã publish.</div> : null}
          </aside>

          {active ? <section className="card panel">
            <div className="row">
              <div><div className="eyebrow">{active.teacherName || 'Foundation'}</div><h2>{active.title}</h2><p>{active.description}</p></div>
              {active.continueLessonId ? <button className="btn primary" onClick={() => setActiveLessonId(active.continueLessonId || '')}>Tiếp tục học</button> : null}
            </div>
            <div className="study-progress-strip" style={{ margin: '16px 0' }}>
              <div className="study-progress-copy"><strong>{percent}%</strong><span>{completed}/{total} lesson</span></div>
              <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
              <div className="study-reward-row"><span>{active.estimatedMinutes ?? 0} phút</span></div>
            </div>

            <div className="dashboard-layout">
              <div className="list">
                {(active.units ?? []).map((unit) => <article className="card panel" key={unit.id}>
                  <div className="eyebrow">Unit {unit.orderIndex}</div>
                  <h3>{unit.title}</h3>
                  <p>{unit.description}</p>
                  <div className="list">
                    {(unit.lessons ?? []).map((lesson) => <button className={lesson.id === activeLesson?.id ? 'test-list-button active' : 'test-list-button'} key={lesson.id} onClick={() => { setActiveLessonId(lesson.id); if (lesson.progressStatus === 'NOT_STARTED') startLesson(lesson.id); }}>
                      <strong>{lesson.title}</strong>
                      <span className="meta">{statusText(lesson.progressStatus)} · {lesson.estimatedMinutes} phút · {lesson.completionCondition}</span>
                    </button>)}
                  </div>
                </article>)}
              </div>

              <aside className="card panel form">
                {activeLesson ? <>
                  <div className="eyebrow">Bài học</div>
                  <h2>{activeLesson.title}</h2>
                  <span className="badge">{statusText(activeLesson.progressStatus)}</span>
                  <p>{activeLesson.content || 'Lesson này chưa có nội dung chi tiết.'}</p>
                  <button className="btn" onClick={() => startLesson(activeLesson.id)}>Đánh dấu đang học</button>
                  <button className="btn primary" onClick={() => completeLesson(activeLesson.id)}>Hoàn thành Lesson</button>
                </> : <div className="notice">Khóa học chưa có lesson published.</div>}
              </aside>
            </div>
          </section> : <section className="card panel"><h2>Chưa chọn khóa học</h2></section>}
        </div>
      </section>
    </main>
  );
}
