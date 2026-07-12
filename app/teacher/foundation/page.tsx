'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/app/components/AppHeader';
import { teacherApi } from '@/lib/api/teacher';
import { GrammarExerciseBuilder } from './GrammarExerciseBuilder';

type BlockType = 'HEADING' | 'TEXT' | 'CALLOUT' | 'QUOTE' | 'GRAMMAR_EXERCISE';
type Block = { id: string; type: BlockType; content: string; orderIndex: number };
type Lesson = { id: string; title: string; status: string; orderIndex: number; estimatedMinutes: number; completionCondition: string; blocks?: Block[] };
type Unit = { id: string; title: string; description?: string; orderIndex: number; lessons?: Lesson[] };
type Course = { id: string; title: string; description?: string; slug: string; status: string; level?: string; estimatedMinutes?: number; completionRule?: string; unitCount?: number; lessonCount?: number; units?: Unit[] };

type CourseForm = { title: string; description: string; status: 'DRAFT' | 'PUBLISHED'; level: string; estimatedMinutes: string; completionRule: string };
type UnitForm = { title: string; description: string; orderIndex: string };
type LessonForm = { title: string; status: 'DRAFT' | 'PUBLISHED'; orderIndex: string; estimatedMinutes: string; completionCondition: string };
type BlockForm = { type: BlockType; content: string; orderIndex: string };

const emptyCourse: CourseForm = { title: '', description: '', status: 'DRAFT', level: 'Foundation', estimatedMinutes: '0', completionRule: 'COMPLETE_ALL_LESSONS' };
const emptyUnit: UnitForm = { title: '', description: '', orderIndex: '' };
const emptyLesson: LessonForm = { title: '', status: 'DRAFT', orderIndex: '', estimatedMinutes: '10', completionCondition: 'MARK_AS_DONE' };
const emptyBlock: BlockForm = { type: 'TEXT', content: '', orderIndex: '' };

function numeric(value: string) { return value === '' ? undefined : Number(value); }
function statusLabel(status: string) { return status === 'PUBLISHED' ? 'Đã publish' : 'Nháp'; }
function courseForm(course: Course): CourseForm { return { title: course.title, description: course.description || '', status: course.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT', level: course.level || 'Foundation', estimatedMinutes: String(course.estimatedMinutes ?? 0), completionRule: course.completionRule || 'COMPLETE_ALL_LESSONS' }; }
function unitForm(unit: Unit): UnitForm { return { title: unit.title, description: unit.description || '', orderIndex: String(unit.orderIndex ?? 0) }; }
function lessonForm(lesson: Lesson): LessonForm { return { title: lesson.title, status: lesson.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT', orderIndex: String(lesson.orderIndex ?? 0), estimatedMinutes: String(lesson.estimatedMinutes ?? 10), completionCondition: lesson.completionCondition || 'MARK_AS_DONE' }; }
function blockForm(block: Block): BlockForm { return { type: block.type || 'TEXT', content: block.content || '', orderIndex: String(block.orderIndex ?? 0) }; }
function allLessons(course: Course | null) { return (course?.units ?? []).flatMap((unit) => unit.lessons ?? []); }

function RenderBlock({ block }: { block: Block }) {
  if (block.type === 'HEADING') return <h2>{block.content}</h2>;
  if (block.type === 'CALLOUT') return <div className="notice">{block.content}</div>;
  if (block.type === 'QUOTE') return <blockquote className="quick-box">{block.content}</blockquote>;
  if (block.type === 'GRAMMAR_EXERCISE') return <div className="notice">Grammar exercise block</div>;
  return <p>{block.content}</p>;
}

export default function TeacherFoundationPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [detail, setDetail] = useState<Course | null>(null);
  const [course, setCourse] = useState<CourseForm>(emptyCourse);
  const [newCourse, setNewCourse] = useState<CourseForm>(emptyCourse);
  const [unitDraft, setUnitDraft] = useState<UnitForm>(emptyUnit);
  const [lessonDrafts, setLessonDrafts] = useState<Record<string, LessonForm>>({});
  const [blockDrafts, setBlockDrafts] = useState<Record<string, BlockForm>>({});
  const [editingUnits, setEditingUnits] = useState<Record<string, UnitForm>>({});
  const [editingLessons, setEditingLessons] = useState<Record<string, LessonForm>>({});
  const [editingBlocks, setEditingBlocks] = useState<Record<string, BlockForm>>({});
  const [previewLessonId, setPreviewLessonId] = useState('');
  const [dragBlockId, setDragBlockId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadList(nextSlug = selectedSlug) {
    try {
      setError('');
      const res = await teacherApi.getFoundationCourses();
      const list = (res.data as Course[]) ?? [];
      setCourses(list);
      if (!nextSlug && list[0]) openCourse(list[0].slug);
    } catch (err) { setError(err instanceof Error ? err.message : 'Không tải được khóa học'); }
  }

  async function openCourse(slug: string) {
    try {
      setSelectedSlug(slug);
      const res = await teacherApi.getFoundationCourse(slug);
      const payload = res.data as Course | null;
      if (!payload) throw new Error('Không tìm thấy khóa học');
      setDetail(payload); setCourse(courseForm(payload)); setPreviewLessonId('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Không mở được khóa học'); }
  }

  useEffect(() => { loadList(''); }, []);
  const previewLesson = useMemo(() => allLessons(detail).find((lesson) => lesson.id === previewLessonId) || null, [detail, previewLessonId]);

  async function refreshFrom(response: unknown) { setDetail((response as { data?: Course | null }).data ?? null); }

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newCourse.title.trim() || 'Foundation course mới';
    setSaving(true);
    setError('');
    try {
      const res = await teacherApi.createFoundationCourse({ ...newCourse, title, estimatedMinutes: numeric(newCourse.estimatedMinutes) });
      const created = res.data as Course | null;
      if (!created?.slug) throw new Error('Backend không trả về khóa học vừa tạo.');
      setNewCourse(emptyCourse);
      await loadList(created.slug);
      await openCourse(created.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được khóa học');
    } finally {
      setSaving(false);
    }
  }
  async function saveCourse() { if (!detail) return; const res = await teacherApi.updateFoundationCourse(detail.slug, { ...course, estimatedMinutes: numeric(course.estimatedMinutes) }); await refreshFrom(res); await loadList(detail.slug); }
  async function createUnit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!detail || !unitDraft.title.trim()) return; const res = await teacherApi.createFoundationUnit(detail.slug, { ...unitDraft, orderIndex: numeric(unitDraft.orderIndex) }); await refreshFrom(res); setUnitDraft(emptyUnit); }
  async function saveUnit(unitId: string) { const form = editingUnits[unitId]; if (!form) return; await refreshFrom(await teacherApi.updateFoundationUnit(unitId, { ...form, orderIndex: numeric(form.orderIndex) })); }
  async function createLesson(event: FormEvent<HTMLFormElement>, unitId: string) { event.preventDefault(); const form = lessonDrafts[unitId] || emptyLesson; if (!form.title.trim()) return; await refreshFrom(await teacherApi.createFoundationLesson(unitId, { ...form, orderIndex: numeric(form.orderIndex), estimatedMinutes: numeric(form.estimatedMinutes) })); setLessonDrafts((current) => ({ ...current, [unitId]: emptyLesson })); }
  async function saveLesson(lessonId: string) { const form = editingLessons[lessonId]; if (!form) return; await refreshFrom(await teacherApi.updateFoundationLesson(lessonId, { ...form, orderIndex: numeric(form.orderIndex), estimatedMinutes: numeric(form.estimatedMinutes) })); }
  async function createBlock(event: FormEvent<HTMLFormElement>, lessonId: string) { event.preventDefault(); const form = blockDrafts[lessonId] || emptyBlock; const content = form.content.trim() || (form.type === 'GRAMMAR_EXERCISE' ? 'Grammar exercise' : ''); if (!content) return; await refreshFrom(await teacherApi.createFoundationBlock(lessonId, { ...form, content, orderIndex: numeric(form.orderIndex) })); setBlockDrafts((current) => ({ ...current, [lessonId]: emptyBlock })); }
  async function saveBlock(blockId: string) { const form = editingBlocks[blockId]; if (!form) return; await refreshFrom(await teacherApi.updateFoundationBlock(blockId, { ...form, orderIndex: numeric(form.orderIndex) })); }
  async function deleteBlock(blockId: string) { if (!window.confirm('Xóa block này?')) return; await refreshFrom(await teacherApi.deleteFoundationBlock(blockId)); }
  async function dropBlock(lesson: Lesson, targetId: string) {
    if (!dragBlockId || dragBlockId === targetId) return;
    const ids = (lesson.blocks ?? []).map((block) => block.id).filter((id) => id !== dragBlockId);
    ids.splice(Math.max(0, ids.indexOf(targetId)), 0, dragBlockId);
    await refreshFrom(await teacherApi.reorderFoundationBlocks(lesson.id, ids));
    setDragBlockId('');
  }

  return (
    <main>
      <AppHeader role="teacher" />
      <section className="container">
        <div className="page-head"><div><div className="eyebrow">Lesson Content Builder</div><h1>Foundation lesson blocks</h1><p>Nội dung lesson được lưu bằng block data, có draft/publish và preview student mode.</p></div><Link className="btn" href="/teacher/dashboard">Quay lại dashboard</Link></div>
        {error ? <div className="error">{error}</div> : null}
        <div className="teacher-manage-layout" style={{ marginTop: 18 }}>
          <aside className="test-list-panel">
            <form className="form" onSubmit={createCourse}><div className="eyebrow">Khóa học mới</div><input className="input" placeholder="Foundation 1" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} /><button className="btn primary" disabled={saving}>{saving ? 'Đang tạo...' : 'Tạo khóa học'}</button></form>
            <div className="list">{courses.map((item) => <button className={item.slug === selectedSlug ? 'test-list-button active' : 'test-list-button'} key={item.id} onClick={() => openCourse(item.slug)}><strong>{item.title}</strong><span className="meta">{statusLabel(item.status)} · {item.lessonCount ?? 0} lesson</span></button>)}</div>
          </aside>

          {detail ? <section className="card panel form">
            <div className="row"><div><div className="eyebrow">Course</div><h2>{detail.title}</h2></div><button className="btn primary" onClick={saveCourse}>Lưu draft/course</button></div>
            <div className="compact-fields"><label>Tên khóa<input className="input" value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} /></label><label>Trạng thái<select className="select" value={course.status} onChange={(e) => setCourse({ ...course, status: e.target.value as CourseForm['status'] })}><option value="DRAFT">Nháp</option><option value="PUBLISHED">Published</option></select></label></div>
            <textarea className="textarea" value={course.description} onChange={(e) => setCourse({ ...course, description: e.target.value })} placeholder="Mô tả khóa học" />
            <form className="card panel form" onSubmit={createUnit}><div className="eyebrow">Thêm Unit</div><div className="compact-fields"><input className="input" placeholder="Tên Unit" value={unitDraft.title} onChange={(e) => setUnitDraft({ ...unitDraft, title: e.target.value })} /><input className="input" placeholder="Thứ tự" type="number" value={unitDraft.orderIndex} onChange={(e) => setUnitDraft({ ...unitDraft, orderIndex: e.target.value })} /></div><button className="btn">Tạo Unit</button></form>

            {(detail.units ?? []).map((unit) => {
              const unitEdit = editingUnits[unit.id] || unitForm(unit);
              return <article className="card panel form" key={unit.id}>
                <div className="row"><div><div className="eyebrow">Unit #{unit.orderIndex}</div><h3>{unit.title}</h3></div><button className="btn" onClick={() => saveUnit(unit.id)} type="button">Lưu Unit</button></div>
                <div className="compact-fields"><input className="input" value={unitEdit.title} onChange={(e) => setEditingUnits({ ...editingUnits, [unit.id]: { ...unitEdit, title: e.target.value } })} /><input className="input" type="number" value={unitEdit.orderIndex} onChange={(e) => setEditingUnits({ ...editingUnits, [unit.id]: { ...unitEdit, orderIndex: e.target.value } })} /></div>
                {(unit.lessons ?? []).map((lesson) => {
                  const lf = editingLessons[lesson.id] || lessonForm(lesson);
                  return <div className="quick-box form" key={lesson.id}>
                    <div className="row"><strong>{lesson.title}</strong><div className="actions"><span className="badge">{statusLabel(lesson.status)}</span><button className="btn" type="button" onClick={() => setPreviewLessonId(lesson.id)}>Preview student mode</button><button className="btn" type="button" onClick={() => saveLesson(lesson.id)}>Lưu Lesson</button></div></div>
                    <div className="compact-fields"><input className="input" value={lf.title} onChange={(e) => setEditingLessons({ ...editingLessons, [lesson.id]: { ...lf, title: e.target.value } })} /><select className="select" value={lf.status} onChange={(e) => setEditingLessons({ ...editingLessons, [lesson.id]: { ...lf, status: e.target.value as LessonForm['status'] } })}><option value="DRAFT">Nháp</option><option value="PUBLISHED">Published</option></select></div>
                    <div className="compact-fields"><input className="input" type="number" value={lf.orderIndex} onChange={(e) => setEditingLessons({ ...editingLessons, [lesson.id]: { ...lf, orderIndex: e.target.value } })} /><input className="input" type="number" value={lf.estimatedMinutes} onChange={(e) => setEditingLessons({ ...editingLessons, [lesson.id]: { ...lf, estimatedMinutes: e.target.value } })} /></div>
                    <input className="input" value={lf.completionCondition} onChange={(e) => setEditingLessons({ ...editingLessons, [lesson.id]: { ...lf, completionCondition: e.target.value } })} />
                    <div className="list">
                      {(lesson.blocks ?? []).map((block) => {
                        const bf = editingBlocks[block.id] || blockForm(block);
                        return <article className="card item form" key={block.id} draggable onDragStart={() => setDragBlockId(block.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => dropBlock(lesson, block.id)}>
                          <div className="row"><span className="badge">{block.type}</span><div className="actions"><button className="btn" type="button" onClick={() => saveBlock(block.id)}>Lưu block</button><button className="btn danger" type="button" onClick={() => deleteBlock(block.id)}>Xóa</button></div></div>
                          <div className="compact-fields"><select className="select" value={bf.type} onChange={(e) => setEditingBlocks({ ...editingBlocks, [block.id]: { ...bf, type: e.target.value as BlockType } })}><option value="HEADING">Heading</option><option value="TEXT">Text</option><option value="CALLOUT">Callout</option><option value="QUOTE">Quote</option><option value="GRAMMAR_EXERCISE">Grammar Exercise</option></select><input className="input" type="number" value={bf.orderIndex} onChange={(e) => setEditingBlocks({ ...editingBlocks, [block.id]: { ...bf, orderIndex: e.target.value } })} /></div>
                          <textarea className="textarea" value={bf.content} onChange={(e) => setEditingBlocks({ ...editingBlocks, [block.id]: { ...bf, content: e.target.value } })} />
                          {block.type === 'GRAMMAR_EXERCISE' || bf.type === 'GRAMMAR_EXERCISE' ? <GrammarExerciseBuilder blockId={block.id} /> : null}
                        </article>;
                      })}
                    </div>
                    <form className="card item form" onSubmit={(e) => createBlock(e, lesson.id)}>
                      <div className="eyebrow">Thêm block</div>
                      <div className="compact-fields"><select className="select" value={(blockDrafts[lesson.id] || emptyBlock).type} onChange={(e) => setBlockDrafts({ ...blockDrafts, [lesson.id]: { ...(blockDrafts[lesson.id] || emptyBlock), type: e.target.value as BlockType } })}><option value="HEADING">Heading</option><option value="TEXT">Text</option><option value="CALLOUT">Callout</option><option value="QUOTE">Quote</option><option value="GRAMMAR_EXERCISE">Grammar Exercise</option></select><input className="input" placeholder="Thứ tự" type="number" value={(blockDrafts[lesson.id] || emptyBlock).orderIndex} onChange={(e) => setBlockDrafts({ ...blockDrafts, [lesson.id]: { ...(blockDrafts[lesson.id] || emptyBlock), orderIndex: e.target.value } })} /></div>
                      <textarea className="textarea" placeholder="Nội dung block" value={(blockDrafts[lesson.id] || emptyBlock).content} onChange={(e) => setBlockDrafts({ ...blockDrafts, [lesson.id]: { ...(blockDrafts[lesson.id] || emptyBlock), content: e.target.value } })} />
                      <button className="btn">Thêm block</button>
                    </form>
                  </div>;
                })}
                <form className="quick-box form" onSubmit={(e) => createLesson(e, unit.id)}><div className="eyebrow">Thêm Lesson</div><input className="input" placeholder="Tên lesson" value={(lessonDrafts[unit.id] || emptyLesson).title} onChange={(e) => setLessonDrafts({ ...lessonDrafts, [unit.id]: { ...(lessonDrafts[unit.id] || emptyLesson), title: e.target.value } })} /><button className="btn">Tạo Lesson</button></form>
              </article>;
            })}
          </section> : <section className="card panel"><h2>Chưa chọn khóa học</h2></section>}
        </div>

        {previewLesson ? <section className="card panel" style={{ marginTop: 18 }}><div className="row"><div><div className="eyebrow">Student preview</div><h2>{previewLesson.title}</h2></div><button className="btn" onClick={() => setPreviewLessonId('')}>Đóng preview</button></div><div className="list">{(previewLesson.blocks ?? []).map((block) => <RenderBlock block={block} key={block.id} />)}{!previewLesson.blocks?.length ? <div className="notice">Lesson chưa có block.</div> : null}</div></section> : null}
      </section>
    </main>
  );
}
