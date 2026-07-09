'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/app/components/AppHeader';
import { teacherApi } from '@/lib/api/teacher';

type Lesson = { id: string; title: string; content?: string; status: string; orderIndex: number; estimatedMinutes: number; completionCondition: string };
type Unit = { id: string; title: string; description?: string; orderIndex: number; lessons?: Lesson[] };
type Course = { id: string; title: string; description?: string; slug: string; status: string; level?: string; estimatedMinutes?: number; completionRule?: string; unitCount?: number; lessonCount?: number; units?: Unit[] };

type CourseForm = { title: string; description: string; status: 'DRAFT' | 'PUBLISHED'; level: string; estimatedMinutes: string; completionRule: string };
type UnitForm = { title: string; description: string; orderIndex: string };
type LessonForm = { title: string; content: string; status: 'DRAFT' | 'PUBLISHED'; orderIndex: string; estimatedMinutes: string; completionCondition: string };

const emptyCourse: CourseForm = { title: '', description: '', status: 'DRAFT', level: 'Foundation', estimatedMinutes: '0', completionRule: 'COMPLETE_ALL_LESSONS' };
const emptyUnit: UnitForm = { title: '', description: '', orderIndex: '' };
const emptyLesson: LessonForm = { title: '', content: '', status: 'DRAFT', orderIndex: '', estimatedMinutes: '10', completionCondition: 'MARK_AS_DONE' };

function statusLabel(status: string) { return status === 'PUBLISHED' ? 'Đã publish' : 'Nháp'; }
function lessonForm(lesson: Lesson): LessonForm { return { title: lesson.title, content: lesson.content || '', status: lesson.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT', orderIndex: String(lesson.orderIndex ?? 0), estimatedMinutes: String(lesson.estimatedMinutes ?? 10), completionCondition: lesson.completionCondition || 'MARK_AS_DONE' }; }
function unitForm(unit: Unit): UnitForm { return { title: unit.title, description: unit.description || '', orderIndex: String(unit.orderIndex ?? 0) }; }
function courseForm(course: Course): CourseForm { return { title: course.title, description: course.description || '', status: course.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT', level: course.level || 'Foundation', estimatedMinutes: String(course.estimatedMinutes ?? 0), completionRule: course.completionRule || 'COMPLETE_ALL_LESSONS' }; }
function numeric(value: string) { return value === '' ? undefined : Number(value); }

export default function TeacherFoundationPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [detail, setDetail] = useState<Course | null>(null);
  const [course, setCourse] = useState<CourseForm>(emptyCourse);
  const [newCourse, setNewCourse] = useState<CourseForm>(emptyCourse);
  const [unitDraft, setUnitDraft] = useState<UnitForm>(emptyUnit);
  const [lessonDrafts, setLessonDrafts] = useState<Record<string, LessonForm>>({});
  const [editingUnits, setEditingUnits] = useState<Record<string, UnitForm>>({});
  const [editingLessons, setEditingLessons] = useState<Record<string, LessonForm>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadList(nextSlug = selectedSlug) {
    try {
      setError('');
      const res = await teacherApi.getFoundationCourses();
      const list = (res.data as Course[]) ?? [];
      setCourses(list);
      if (!nextSlug && list[0]) openCourse(list[0].slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được khóa học');
    }
  }

  async function openCourse(slug: string) {
    try {
      setSelectedSlug(slug);
      setError('');
      const res = await teacherApi.getFoundationCourse(slug);
      const payload = res.data as Course | null;
      if (!payload) throw new Error('Không tìm thấy khóa học');
      setDetail(payload);
      setCourse(courseForm(payload));
      setUnitDraft(emptyUnit);
      setLessonDrafts({});
      setEditingUnits({});
      setEditingLessons({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không mở được khóa học');
    }
  }

  useEffect(() => { loadList(''); }, []);

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newCourse.title.trim()) return setError('Nhập tên khóa học trước.');
    setSaving(true);
    try {
      const res = await teacherApi.createFoundationCourse({ ...newCourse, estimatedMinutes: numeric(newCourse.estimatedMinutes) });
      const created = res.data as Course;
      setNewCourse(emptyCourse);
      await loadList(created.slug);
      await openCourse(created.slug);
    } catch (err) { setError(err instanceof Error ? err.message : 'Không tạo được khóa học'); }
    finally { setSaving(false); }
  }

  async function saveCourse() {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await teacherApi.updateFoundationCourse(detail.slug, { ...course, estimatedMinutes: numeric(course.estimatedMinutes) });
      setDetail(res.data as Course);
      await loadList(detail.slug);
    } catch (err) { setError(err instanceof Error ? err.message : 'Không lưu được khóa học'); }
    finally { setSaving(false); }
  }

  async function createUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail || !unitDraft.title.trim()) return;
    setSaving(true);
    try {
      const res = await teacherApi.createFoundationUnit(detail.slug, { ...unitDraft, orderIndex: numeric(unitDraft.orderIndex) });
      setDetail(res.data as Course);
      setUnitDraft(emptyUnit);
    } catch (err) { setError(err instanceof Error ? err.message : 'Không tạo được Unit'); }
    finally { setSaving(false); }
  }

  async function saveUnit(unitId: string) {
    const form = editingUnits[unitId];
    if (!form) return;
    const res = await teacherApi.updateFoundationUnit(unitId, { ...form, orderIndex: numeric(form.orderIndex) });
    setDetail(res.data as Course);
  }

  async function createLesson(event: FormEvent<HTMLFormElement>, unitId: string) {
    event.preventDefault();
    const form = lessonDrafts[unitId] || emptyLesson;
    if (!form.title.trim()) return;
    const res = await teacherApi.createFoundationLesson(unitId, { ...form, orderIndex: numeric(form.orderIndex), estimatedMinutes: numeric(form.estimatedMinutes) });
    setDetail(res.data as Course);
    setLessonDrafts((current) => ({ ...current, [unitId]: emptyLesson }));
  }

  async function saveLesson(lessonId: string) {
    const form = editingLessons[lessonId];
    if (!form) return;
    const res = await teacherApi.updateFoundationLesson(lessonId, { ...form, orderIndex: numeric(form.orderIndex), estimatedMinutes: numeric(form.estimatedMinutes) });
    setDetail(res.data as Course);
  }

  return (
    <main>
      <AppHeader role="teacher" />
      <section className="container">
        <div className="page-head">
          <div><div className="eyebrow">Foundation Course Core</div><h1>Quản lý khóa học nền tảng</h1><p>Tạo course, unit, lesson, thứ tự học, publish lesson và điều kiện hoàn thành.</p></div>
          <Link className="btn" href="/teacher/dashboard">Quay lại dashboard</Link>
        </div>
        {error ? <div className="error">{error}</div> : null}
        <div className="teacher-manage-layout" style={{ marginTop: 18 }}>
          <aside className="test-list-panel">
            <form className="form" onSubmit={createCourse}>
              <div className="eyebrow">Khóa học mới</div>
              <input className="input" placeholder="Foundation 1" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} />
              <textarea className="textarea" placeholder="Mô tả ngắn" value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} />
              <button className="btn primary" disabled={saving}>Tạo khóa học</button>
            </form>
            <div className="list">
              {courses.map((item) => <button className={item.slug === selectedSlug ? 'test-list-button active' : 'test-list-button'} key={item.id} onClick={() => openCourse(item.slug)}><strong>{item.title}</strong><span className="meta">{statusLabel(item.status)} · {item.unitCount ?? 0} unit · {item.lessonCount ?? 0} lesson</span></button>)}
            </div>
          </aside>

          {detail ? <section className="card panel form">
            <div className="row"><div><div className="eyebrow">Course settings</div><h2>{detail.title}</h2></div><button className="btn primary" onClick={saveCourse} disabled={saving}>Lưu course</button></div>
            <div className="compact-fields"><label>Tên khóa<input className="input" value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} /></label><label>Trạng thái<select className="select" value={course.status} onChange={(e) => setCourse({ ...course, status: e.target.value as CourseForm['status'] })}><option value="DRAFT">Nháp</option><option value="PUBLISHED">Published</option></select></label></div>
            <div className="compact-fields"><label>Thời lượng ước tính<input className="input" type="number" value={course.estimatedMinutes} onChange={(e) => setCourse({ ...course, estimatedMinutes: e.target.value })} /></label><label>Điều kiện hoàn thành<input className="input" value={course.completionRule} onChange={(e) => setCourse({ ...course, completionRule: e.target.value })} /></label></div>
            <label>Mô tả<textarea className="textarea" value={course.description} onChange={(e) => setCourse({ ...course, description: e.target.value })} /></label>

            <form className="card panel form" onSubmit={createUnit}>
              <div className="eyebrow">Thêm Unit</div>
              <div className="compact-fields"><input className="input" placeholder="Tên Unit" value={unitDraft.title} onChange={(e) => setUnitDraft({ ...unitDraft, title: e.target.value })} /><input className="input" placeholder="Thứ tự" type="number" value={unitDraft.orderIndex} onChange={(e) => setUnitDraft({ ...unitDraft, orderIndex: e.target.value })} /></div>
              <textarea className="textarea" placeholder="Mô tả Unit" value={unitDraft.description} onChange={(e) => setUnitDraft({ ...unitDraft, description: e.target.value })} />
              <button className="btn">Tạo Unit</button>
            </form>

            {(detail.units ?? []).map((unit) => {
              const unitEdit = editingUnits[unit.id] || unitForm(unit);
              return <article className="card panel form" key={unit.id}>
                <div className="row"><div><div className="eyebrow">Unit #{unit.orderIndex}</div><h3>{unit.title}</h3></div><button className="btn" onClick={() => saveUnit(unit.id)} type="button">Lưu Unit</button></div>
                <div className="compact-fields"><input className="input" value={unitEdit.title} onChange={(e) => setEditingUnits({ ...editingUnits, [unit.id]: { ...unitEdit, title: e.target.value } })} /><input className="input" type="number" value={unitEdit.orderIndex} onChange={(e) => setEditingUnits({ ...editingUnits, [unit.id]: { ...unitEdit, orderIndex: e.target.value } })} /></div>
                {(unit.lessons ?? []).map((lesson) => {
                  const form = editingLessons[lesson.id] || lessonForm(lesson);
                  return <div className="quick-box form" key={lesson.id}>
                    <div className="row"><strong>{lesson.title}</strong><span className="badge">{statusLabel(lesson.status)}</span></div>
                    <div className="compact-fields"><input className="input" value={form.title} onChange={(e) => setEditingLessons({ ...editingLessons, [lesson.id]: { ...form, title: e.target.value } })} /><select className="select" value={form.status} onChange={(e) => setEditingLessons({ ...editingLessons, [lesson.id]: { ...form, status: e.target.value as LessonForm['status'] } })}><option value="DRAFT">Nháp</option><option value="PUBLISHED">Published</option></select></div>
                    <div className="compact-fields"><input className="input" type="number" value={form.orderIndex} onChange={(e) => setEditingLessons({ ...editingLessons, [lesson.id]: { ...form, orderIndex: e.target.value } })} /><input className="input" type="number" value={form.estimatedMinutes} onChange={(e) => setEditingLessons({ ...editingLessons, [lesson.id]: { ...form, estimatedMinutes: e.target.value } })} /></div>
                    <input className="input" value={form.completionCondition} onChange={(e) => setEditingLessons({ ...editingLessons, [lesson.id]: { ...form, completionCondition: e.target.value } })} />
                    <textarea className="textarea" value={form.content} onChange={(e) => setEditingLessons({ ...editingLessons, [lesson.id]: { ...form, content: e.target.value } })} />
                    <button className="btn" onClick={() => saveLesson(lesson.id)} type="button">Lưu Lesson</button>
                  </div>;
                })}
                <form className="quick-box form" onSubmit={(e) => createLesson(e, unit.id)}>
                  <div className="eyebrow">Thêm Lesson</div>
                  <input className="input" placeholder="Tên lesson" value={(lessonDrafts[unit.id] || emptyLesson).title} onChange={(e) => setLessonDrafts({ ...lessonDrafts, [unit.id]: { ...(lessonDrafts[unit.id] || emptyLesson), title: e.target.value } })} />
                  <button className="btn">Tạo Lesson</button>
                </form>
              </article>;
            })}
          </section> : <section className="card panel"><h2>Chưa chọn khóa học</h2></section>}
        </div>
      </section>
    </main>
  );
}
