'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AppHeader } from '@/app/components/AppHeader';
import { SearchField } from '@/app/components/SearchField';
import { teacherApi } from '@/lib/api/teacher';

type VocabularyItem = {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaningVi: string;
  meaningEn?: string;
  exampleSentence?: string;
  exampleMeaningVi?: string;
  tags?: string[];
};

type VocabularySet = {
  id: string;
  title: string;
  description?: string;
  slug: string;
  subject?: string;
  level?: string;
  status: string;
  itemCount?: number;
  assignmentCount?: number;
};

type SetForm = {
  title: string;
  description: string;
  subject: string;
  level: string;
  status: 'DRAFT' | 'PUBLISHED';
};

type ItemForm = {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaningVi: string;
  meaningEn: string;
  exampleSentence: string;
  exampleMeaningVi: string;
  tags: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type AudienceStudent = {
  id: string;
  fullName: string;
  email: string;
  classNames?: string[];
};

type AudienceClass = {
  id: string;
  name: string;
  subject?: string;
  level?: string;
  studentCount: number;
  students?: AudienceStudent[];
};

type VocabularyAssignment = {
  id: string;
  title: string;
  deadline?: string;
  dailyTarget: number;
  requiredMasteryPercent: number;
  classId?: string;
  className?: string;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  targetType: 'CLASS' | 'STUDENT';
  targetLabel: string;
  createdAt?: string;
};

type WeakVocabularyWord = {
  id: string;
  word: string;
  meaningVi?: string;
  wrongCount: number;
  confidence: number;
  lastReviewedAt?: string;
};

type AssignmentStudentProgress = {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  totalWords: number;
  learnedWords: number;
  masteredWords: number;
  weakWords: number;
  accuracy: number;
  completionPercent: number;
  lastStudiedAt?: string;
  weakWordDetails?: WeakVocabularyWord[];
};
type AssignmentForm = {
  title: string;
  deadline: string;
  dailyTarget: string;
  requiredMasteryPercent: string;
  classId: string;
  studentIds: string[];
};

type AudiencePayload = {
  classes: AudienceClass[];
  students: AudienceStudent[];
};

const PAGE_SIZE = 5;

const emptyItem: ItemForm = {
  word: '',
  phonetic: '',
  partOfSpeech: '',
  meaningVi: '',
  meaningEn: '',
  exampleSentence: '',
  exampleMeaningVi: '',
  tags: '',
};

const emptyAssignment: AssignmentForm = {
  title: '',
  deadline: '',
  dailyTarget: '5',
  requiredMasteryPercent: '80',
  classId: '',
  studentIds: [],
};

function statusLabel(status: string) {
  return status === 'PUBLISHED' ? 'Da dang' : 'Nhap';
}

function toForm(set: VocabularySet): SetForm {
  return {
    title: set.title || '',
    description: set.description || '',
    subject: set.subject || '',
    level: set.level || '',
    status: set.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
  };
}

function itemToForm(item: VocabularyItem): ItemForm {
  return {
    word: item.word || '',
    phonetic: item.phonetic || '',
    partOfSpeech: item.partOfSpeech || '',
    meaningVi: item.meaningVi || '',
    meaningEn: item.meaningEn || '',
    exampleSentence: item.exampleSentence || '',
    exampleMeaningVi: item.exampleMeaningVi || '',
    tags: (item.tags || []).join(', '),
  };
}

function normalizeItemPayload(form: ItemForm) {
  return {
    ...form,
    tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
  };
}

function formatDateTime(value?: string) {
  if (!value) return 'Khong co han';
  return new Date(value).toLocaleString('vi-VN');
}

function toAssignmentDeadline(value: string) {
  return value || null;
}

export default function TeacherVocabularyPage() {
  const [sets, setSets] = useState<VocabularySet[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [detail, setDetail] = useState<VocabularySet | null>(null);
  const [setForm, setSetForm] = useState<SetForm | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItem);
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItemId, setEditingItemId] = useState('');
  const [editingItemForm, setEditingItemForm] = useState<ItemForm>(emptyItem);
  const [audience, setAudience] = useState<AudiencePayload>({ classes: [], students: [] });
  const [assignments, setAssignments] = useState<VocabularyAssignment[]>([]);
  const [assignmentProgress, setAssignmentProgress] = useState<Record<string, AssignmentStudentProgress[]>>({});
  const [expandedProgressAssignmentId, setExpandedProgressAssignmentId] = useState('');
  const [expandedProgressStudentId, setExpandedProgressStudentId] = useState('');
  const [loadingProgressId, setLoadingProgressId] = useState('');
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>(emptyAssignment);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  async function loadList(nextSelected = selectedSlug) {
    try {
      setError('');
      const res = await teacherApi.getVocabularySets();
      const nextSets = (res.data as VocabularySet[]) ?? [];
      setSets(nextSets);
      if (!nextSelected && nextSets[0]) {
        await openDetail(nextSets[0].slug);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong tai duoc danh sach tu vung');
    }
  }

  async function loadAudience() {
    try {
      const res = await teacherApi.getVocabularyAudience();
      const payload = (res.data ?? { classes: [], students: [] }) as AudiencePayload;
      setAudience({
        classes: payload.classes ?? [],
        students: payload.students ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong tai duoc danh sach lop va hoc sinh');
    }
  }

  async function loadItems(slug: string, page = 1, query = searchQuery) {
    setLoadingItems(true);
    setError('');
    try {
      const res = await teacherApi.getVocabularyItems(slug, { page, pageSize: PAGE_SIZE, query });
      const payload = (res.data ?? {}) as {
        items?: VocabularyItem[];
        pagination?: Pagination;
        query?: string;
      };
      setItems(payload.items ?? []);
      setPagination(payload.pagination ?? { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 });
      setSearchQuery(payload.query ?? query ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong tai duoc danh sach tu');
    } finally {
      setLoadingItems(false);
    }
  }

  async function loadAssignments(slug: string) {
    setLoadingAssignments(true);
    try {
      const res = await teacherApi.getVocabularyAssignments(slug);
      setAssignments((res.data as VocabularyAssignment[]) ?? []);
      setAssignmentProgress({});
      setExpandedProgressAssignmentId('');
      setExpandedProgressStudentId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong tai duoc assignment');
    } finally {
      setLoadingAssignments(false);
    }
  }

  async function loadAssignmentProgress(assignmentId: string) {
    if (!selectedSlug) return;
    if (expandedProgressAssignmentId === assignmentId) {
      setExpandedProgressAssignmentId('');
      setExpandedProgressStudentId('');
      return;
    }
    setExpandedProgressAssignmentId(assignmentId);
    setExpandedProgressStudentId('');
    if (assignmentProgress[assignmentId]) return;
    setLoadingProgressId(assignmentId);
    setError('');
    try {
      const res = await teacherApi.getVocabularyAssignmentProgress(selectedSlug, assignmentId);
      setAssignmentProgress((current) => ({
        ...current,
        [assignmentId]: (res.data as AssignmentStudentProgress[]) ?? [],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong tai duoc tien do assignment');
    } finally {
      setLoadingProgressId('');
    }
  }
  async function openDetail(slug: string) {
    setSelectedSlug(slug);
    setLoadingDetail(true);
    setError('');
    setEditingItemId('');
    try {
      const res = await teacherApi.getVocabularySet(slug);
      const nextDetail = res.data as VocabularySet | null;
      if (!nextDetail) throw new Error('Khong tim thay bo tu vung');
      setDetail(nextDetail);
      setSetForm(toForm(nextDetail));
      setItemForm(emptyItem);
      setAssignmentForm({ ...emptyAssignment, title: nextDetail.title ? `Luyen tap: ${nextDetail.title}` : '' });
      setSearchInput('');
      setSearchQuery('');
      await Promise.all([loadItems(slug, 1, ''), loadAssignments(slug)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong mo duoc bo tu vung');
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    loadAudience();
    loadList('');
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!selectedSlug) return;
      const nextQuery = searchInput.trim();
      if (nextQuery === searchQuery) return;
      loadItems(selectedSlug, 1, nextQuery);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput, searchQuery, selectedSlug]);

  async function refreshCurrentSet(page = pagination.page, query = searchQuery) {
    if (!selectedSlug) return;
    const res = await teacherApi.getVocabularySet(selectedSlug);
    const nextDetail = res.data as VocabularySet | null;
    if (nextDetail) {
      setDetail(nextDetail);
      setSetForm(toForm(nextDetail));
    }
    await loadList(selectedSlug);
    await Promise.all([loadItems(selectedSlug, page, query), loadAssignments(selectedSlug)]);
  }

  async function saveSet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlug || !setForm) return;
    if (!setForm.title.trim()) {
      setError('Vui long nhap ten bo tu.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await teacherApi.updateVocabularySet(selectedSlug, setForm);
      await refreshCurrentSet();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong luu duoc bo tu vung');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(status: 'DRAFT' | 'PUBLISHED') {
    if (!selectedSlug || !setForm) return;
    setSaving(true);
    setError('');
    try {
      await teacherApi.updateVocabularySet(selectedSlug, { ...setForm, status });
      await refreshCurrentSet();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong cap nhat duoc trang thai');
    } finally {
      setSaving(false);
    }
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlug) return;
    if (!itemForm.word.trim() || !itemForm.meaningVi.trim()) {
      setError('Vui long nhap tu va nghia tieng Viet.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await teacherApi.createVocabularyItem(selectedSlug, normalizeItemPayload(itemForm));
      setItemForm(emptyItem);
      await refreshCurrentSet(1, searchQuery);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong them duoc tu');
    } finally {
      setSaving(false);
    }
  }

  async function submitAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlug) return;
    if (!assignmentForm.title.trim()) {
      setError('Vui long nhap tieu de assignment.');
      return;
    }
    if (!assignmentForm.classId && assignmentForm.studentIds.length === 0) {
      setError('Vui long chon mot lop hoac it nhat mot hoc sinh.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await teacherApi.createVocabularyAssignments(selectedSlug, {
        title: assignmentForm.title,
        deadline: toAssignmentDeadline(assignmentForm.deadline),
        dailyTarget: Number(assignmentForm.dailyTarget || 5),
        requiredMasteryPercent: Number(assignmentForm.requiredMasteryPercent || 80),
        classId: assignmentForm.classId || null,
        studentIds: assignmentForm.studentIds,
      });
      setAssignmentForm({ ...emptyAssignment, title: detail?.title ? `Luyen tap: ${detail.title}` : '' });
      await refreshCurrentSet();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong tao duoc assignment');
    } finally {
      setSaving(false);
    }
  }

  function beginEditItem(item: VocabularyItem) {
    setEditingItemId(item.id);
    setEditingItemForm(itemToForm(item));
  }

  function cancelEditItem() {
    setEditingItemId('');
    setEditingItemForm(emptyItem);
  }

  function toggleStudent(studentId: string) {
    setAssignmentForm((current) => ({
      ...current,
      studentIds: current.studentIds.includes(studentId)
        ? current.studentIds.filter((id) => id !== studentId)
        : [...current.studentIds, studentId],
    }));
  }

  async function saveItem(itemId: string) {
    if (!selectedSlug) return;
    if (!editingItemForm.word.trim() || !editingItemForm.meaningVi.trim()) {
      setError('Vui long nhap tu va nghia tieng Viet truoc khi luu.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await teacherApi.updateVocabularyItem(selectedSlug, itemId, normalizeItemPayload(editingItemForm));
      cancelEditItem();
      await refreshCurrentSet(pagination.page, searchQuery);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong cap nhat duoc tu');
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(itemId: string) {
    if (!selectedSlug || !confirm('Xoa tu nay khoi bo tu vung?')) return;
    setSaving(true);
    setError('');
    try {
      await teacherApi.deleteVocabularyItem(selectedSlug, itemId);
      const nextPage = pagination.page > 1 && items.length === 1 ? pagination.page - 1 : pagination.page;
      if (editingItemId === itemId) cancelEditItem();
      await refreshCurrentSet(nextPage, searchQuery);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong xoa duoc tu');
    } finally {
      setSaving(false);
    }
  }

  const pageNumbers = useMemo(() => Array.from({ length: pagination.totalPages || 1 }, (_, index) => index + 1), [pagination.totalPages]);

  return (
    <main>
      <AppHeader role="teacher" />
      <section className="container">
        <div className="page-head">
          <div>
            <div className="eyebrow">Vocabulary</div>
            <h1>Quan ly bo tu vung</h1>
            <p>Tao, chinh sua, them tu thu cong, dang/an bo tu va giao cho lop hoac hoc sinh. Flashcard se duoc them o phase sau.</p>
          </div>
          <div className="actions">
            <Link className="btn" href="/teacher/dashboard">Quay lai</Link>
            <Link className="btn primary" href="/teacher/vocabulary/new">Tao bo tu moi</Link>
          </div>
        </div>

        {error ? <div className="error" style={{ marginBottom: 14 }}>{error}</div> : null}

        <div className="teacher-manage-layout">
          <aside className="test-list-panel">
            {sets.map((set) => (
              <button className={selectedSlug === set.slug ? 'test-list-button active' : 'test-list-button'} key={set.slug} onClick={() => openDetail(set.slug)} type="button">
                <div className="row" style={{ justifyContent: 'flex-start' }}>
                  <h3>{set.title}</h3>
                  <span className="badge">{statusLabel(set.status)}</span>
                </div>
                <div className="meta">
                  <span>{set.subject || 'Chung'}</span>
                  <span>{set.level || 'Moi trinh do'}</span>
                  <span>{set.itemCount ?? 0} tu</span>
                  <span>{set.assignmentCount ?? 0} assignment</span>
                </div>
              </button>
            ))}
            {!error && sets.length === 0 ? <div className="notice">Chua co bo tu vung. Hay tao bo dau tien.</div> : null}
          </aside>

          <section className="card panel detail-editor">
            <div className="row">
              <div>
                <div className="eyebrow">Sua bo tu</div>
                <h2>{detail?.title || 'Chon bo tu vung'}</h2>
              </div>
              {detail ? (
                <div className="actions">
                  <button className="btn" disabled={saving} onClick={() => updateStatus('DRAFT')} type="button">An bo tu</button>
                  <button className="btn primary" disabled={saving} onClick={() => updateStatus('PUBLISHED')} type="button">Dang bo tu</button>
                </div>
              ) : null}
            </div>

            {loadingDetail ? <div className="notice">Dang mo bo tu vung...</div> : null}
            {detail && setForm ? (
              <>
                <form className="form" onSubmit={saveSet}>
                  <div className="compact-fields">
                    <label>Ten bo tu<input className="input" value={setForm.title} onChange={(event) => setSetForm({ ...setForm, title: event.target.value })} /></label>
                    <label>Trang thai<select className="select" value={setForm.status} onChange={(event) => setSetForm({ ...setForm, status: event.target.value as 'DRAFT' | 'PUBLISHED' })}><option value="DRAFT">Nhap</option><option value="PUBLISHED">Da dang</option></select></label>
                    <label>Mon / chu de<input className="input" value={setForm.subject} onChange={(event) => setSetForm({ ...setForm, subject: event.target.value })} /></label>
                    <label>Trinh do<input className="input" value={setForm.level} onChange={(event) => setSetForm({ ...setForm, level: event.target.value })} /></label>
                  </div>
                  <label>Mo ta<textarea className="textarea" value={setForm.description} onChange={(event) => setSetForm({ ...setForm, description: event.target.value })} /></label>
                  <div className="actions"><button className="btn primary" disabled={saving} type="submit">{saving ? 'Dang luu...' : 'Luu thong tin'}</button></div>
                </form>

                <form className="card question-card form" onSubmit={addItem}>
                  <div><div className="eyebrow">Them tu thu cong</div><h2>Tu moi</h2></div>
                  <div className="compact-fields">
                    <label>Word<input className="input" value={itemForm.word} onChange={(event) => setItemForm({ ...itemForm, word: event.target.value })} /></label>
                    <label>Phonetic<input className="input" value={itemForm.phonetic} onChange={(event) => setItemForm({ ...itemForm, phonetic: event.target.value })} placeholder="/word/" /></label>
                    <label>Part of speech<input className="input" value={itemForm.partOfSpeech} onChange={(event) => setItemForm({ ...itemForm, partOfSpeech: event.target.value })} placeholder="noun, verb..." /></label>
                    <label>Tags<input className="input" value={itemForm.tags} onChange={(event) => setItemForm({ ...itemForm, tags: event.target.value })} placeholder="ielts, unit 1" /></label>
                  </div>
                  <div className="compact-fields">
                    <label>Meaning VI<textarea className="textarea" value={itemForm.meaningVi} onChange={(event) => setItemForm({ ...itemForm, meaningVi: event.target.value })} /></label>
                    <label>Meaning EN<textarea className="textarea" value={itemForm.meaningEn} onChange={(event) => setItemForm({ ...itemForm, meaningEn: event.target.value })} /></label>
                  </div>
                  <div className="compact-fields">
                    <label>Example sentence<textarea className="textarea" value={itemForm.exampleSentence} onChange={(event) => setItemForm({ ...itemForm, exampleSentence: event.target.value })} /></label>
                    <label>Example meaning VI<textarea className="textarea" value={itemForm.exampleMeaningVi} onChange={(event) => setItemForm({ ...itemForm, exampleMeaningVi: event.target.value })} /></label>
                  </div>
                  <div className="actions"><button className="btn primary" disabled={saving} type="submit">Them tu</button></div>
                </form>

                <div className="row vocabulary-toolbar" style={{ marginTop: 10 }}>
                  <div>
                    <div className="eyebrow">Danh sach tu</div>
                    <h2>{pagination.totalItems} tu</h2>
                  </div>
                  <div className="vocabulary-toolbar-actions">
                    <SearchField
                      ariaLabel="Tim tu trong bo tu vung"
                      onChange={setSearchInput}
                      placeholder="Tim theo Word hoac Meaning VI"
                      value={searchInput}
                    />
                  </div>
                </div>

                {loadingItems ? <div className="notice">Dang tai danh sach tu...</div> : null}
                <div className="list">
                  {items.map((item) => {
                    const isEditing = editingItemId === item.id;
                    return (
                      <article className="card list-item vocabulary-item-card" key={item.id}>
                        {isEditing ? (
                          <div className="form vocabulary-item-editor">
                            <div className="compact-fields">
                              <label>Word<input className="input" value={editingItemForm.word} onChange={(event) => setEditingItemForm({ ...editingItemForm, word: event.target.value })} /></label>
                              <label>Phonetic<input className="input" value={editingItemForm.phonetic} onChange={(event) => setEditingItemForm({ ...editingItemForm, phonetic: event.target.value })} /></label>
                              <label>Part of speech<input className="input" value={editingItemForm.partOfSpeech} onChange={(event) => setEditingItemForm({ ...editingItemForm, partOfSpeech: event.target.value })} /></label>
                              <label>Tags<input className="input" value={editingItemForm.tags} onChange={(event) => setEditingItemForm({ ...editingItemForm, tags: event.target.value })} /></label>
                            </div>
                            <div className="compact-fields">
                              <label>Meaning VI<textarea className="textarea" value={editingItemForm.meaningVi} onChange={(event) => setEditingItemForm({ ...editingItemForm, meaningVi: event.target.value })} /></label>
                              <label>Meaning EN<textarea className="textarea" value={editingItemForm.meaningEn} onChange={(event) => setEditingItemForm({ ...editingItemForm, meaningEn: event.target.value })} /></label>
                            </div>
                            <div className="compact-fields">
                              <label>Example sentence<textarea className="textarea" value={editingItemForm.exampleSentence} onChange={(event) => setEditingItemForm({ ...editingItemForm, exampleSentence: event.target.value })} /></label>
                              <label>Example meaning VI<textarea className="textarea" value={editingItemForm.exampleMeaningVi} onChange={(event) => setEditingItemForm({ ...editingItemForm, exampleMeaningVi: event.target.value })} /></label>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="row" style={{ justifyContent: 'flex-start' }}>
                              <h3>{item.word}</h3>
                              {item.partOfSpeech ? <span className="badge">{item.partOfSpeech}</span> : null}
                            </div>
                            <p>{item.meaningVi}</p>
                            <div className="meta">
                              {item.phonetic ? <span>{item.phonetic}</span> : null}
                              {item.meaningEn ? <span>{item.meaningEn}</span> : null}
                              {(item.tags ?? []).map((tag) => <span key={tag}>#{tag}</span>)}
                            </div>
                          </div>
                        )}

                        <div className="vocabulary-item-actions">
                          {isEditing ? (
                            <>
                              <button className="btn" disabled={saving} onClick={cancelEditItem} type="button">Huy</button>
                              <button className="btn primary" disabled={saving} onClick={() => saveItem(item.id)} type="button">Luu</button>
                            </>
                          ) : (
                            <>
                              <button className="btn" disabled={saving} onClick={() => beginEditItem(item)} type="button">Sua</button>
                              <button className="btn danger" disabled={saving} onClick={() => deleteItem(item.id)} type="button">Xoa</button>
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })}
                  {!loadingItems && items.length === 0 ? <div className="notice">Khong co tu nao khop voi bo loc hien tai.</div> : null}
                </div>

                {pagination.totalPages > 1 ? (
                  <div className="pagination-bar">
                    <button className="btn" disabled={saving || loadingItems || pagination.page === 1} onClick={() => loadItems(selectedSlug, pagination.page - 1, searchQuery)} type="button">Truoc</button>
                    <div className="pagination-pages">
                      {pageNumbers.map((page) => (
                        <button
                          className={page === pagination.page ? 'btn primary pagination-page' : 'btn pagination-page'}
                          disabled={saving || loadingItems}
                          key={page}
                          onClick={() => loadItems(selectedSlug, page, searchQuery)}
                          type="button"
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button className="btn" disabled={saving || loadingItems || pagination.page === pagination.totalPages} onClick={() => loadItems(selectedSlug, pagination.page + 1, searchQuery)} type="button">Sau</button>
                  </div>
                ) : null}

                <form className="card panel form assignment-panel" onSubmit={submitAssignment}>
                  <div className="row">
                    <div>
                      <div className="eyebrow">Phase 3</div>
                      <h2>Giao bo tu</h2>
                    </div>
                    <div className="meta">
                      <span>{assignments.length} assignment</span>
                    </div>
                  </div>
                  <div className="compact-fields">
                    <label>Tieu de assignment<input className="input" value={assignmentForm.title} onChange={(event) => setAssignmentForm({ ...assignmentForm, title: event.target.value })} /></label>
                    <label>Deadline<input className="input" type="datetime-local" value={assignmentForm.deadline} onChange={(event) => setAssignmentForm({ ...assignmentForm, deadline: event.target.value })} /></label>
                    <label>Daily target<input className="input" min={1} type="number" value={assignmentForm.dailyTarget} onChange={(event) => setAssignmentForm({ ...assignmentForm, dailyTarget: event.target.value })} /></label>
                    <label>Required mastery %<input className="input" max={100} min={1} type="number" value={assignmentForm.requiredMasteryPercent} onChange={(event) => setAssignmentForm({ ...assignmentForm, requiredMasteryPercent: event.target.value })} /></label>
                  </div>
                  <div className="compact-fields assignment-target-grid">
                    <label>
                      Giao cho lop
                      <select className="select" value={assignmentForm.classId} onChange={(event) => setAssignmentForm({ ...assignmentForm, classId: event.target.value })}>
                        <option value="">Khong chon lop</option>
                        {audience.classes.map((klass) => (
                          <option key={klass.id} value={klass.id}>{klass.name} ({klass.studentCount} hoc sinh)</option>
                        ))}
                      </select>
                    </label>
                    <div className="assignment-student-picker">
                      <span className="assignment-picker-label">Hoac chon hoc sinh</span>
                      <div className="assignment-student-list">
                        {audience.students.map((student) => (
                          <label className="assignment-student-option" key={student.id}>
                            <input checked={assignmentForm.studentIds.includes(student.id)} onChange={() => toggleStudent(student.id)} type="checkbox" />
                            <span>
                              <strong>{student.fullName}</strong>
                              <small>{student.email}{student.classNames?.length ? ` - ${student.classNames.join(', ')}` : ''}</small>
                            </span>
                          </label>
                        ))}
                        {audience.students.length === 0 ? <div className="notice">Chua co hoc sinh trong cac lop cua giao vien.</div> : null}
                      </div>
                    </div>
                  </div>
                  <div className="actions">
                    <button className="btn primary" disabled={saving} type="submit">Tao assignment</button>
                  </div>
                </form>

                <div className="row" style={{ marginTop: 10 }}>
                  <div>
                    <div className="eyebrow">Assignment da tao</div>
                    <h2>{assignments.length} muc</h2>
                  </div>
                </div>
                {loadingAssignments ? <div className="notice">Dang tai assignment...</div> : null}
                <div className="list">
                  {assignments.map((assignment) => {
                    const progressRows = assignmentProgress[assignment.id] ?? [];
                    const isProgressOpen = expandedProgressAssignmentId === assignment.id;
                    return (
                      <article className="card assignment-item vocabulary-progress-card" key={assignment.id}>
                        <div className="row assignment-progress-head">
                          <div>
                            <div className="row" style={{ justifyContent: 'flex-start' }}>
                              <h3>{assignment.title}</h3>
                              <span className="badge">{assignment.targetType === 'CLASS' ? 'Class' : 'Student'}</span>
                            </div>
                            <p>{assignment.targetLabel}</p>
                            <div className="meta">
                              <span>Deadline: <strong>{formatDateTime(assignment.deadline)}</strong></span>
                              <span>Daily target: <strong>{assignment.dailyTarget}</strong></span>
                              <span>Mastery: <strong>{assignment.requiredMasteryPercent}%</strong></span>
                            </div>
                          </div>
                          <button className="btn" disabled={loadingProgressId === assignment.id} onClick={() => loadAssignmentProgress(assignment.id)} type="button">
                            {loadingProgressId === assignment.id ? 'Dang tai...' : isProgressOpen ? 'An tien do' : 'Xem tien do'}
                          </button>
                        </div>

                        {isProgressOpen ? (
                          <div className="assignment-progress-panel">
                            {loadingProgressId === assignment.id ? <div className="notice">Dang tai tien do hoc sinh...</div> : null}
                            {!loadingProgressId && progressRows.length === 0 ? <div className="notice">Chua co hoc sinh trong assignment nay.</div> : null}
                            {progressRows.length ? (
                              <div className="assignment-progress-table">
                                <div className="assignment-progress-row assignment-progress-row-head">
                                  <span>Hoc sinh</span>
                                  <span>Learned</span>
                                  <span>Mastered</span>
                                  <span>Weak</span>
                                  <span>Accuracy</span>
                                  <span>Last studied</span>
                                  <span>Completion</span>
                                  <span></span>
                                </div>
                                {progressRows.map((row) => {
                                  const detailsOpen = expandedProgressStudentId === row.studentId;
                                  return (
                                    <div className="assignment-progress-student" key={row.studentId}>
                                      <div className="assignment-progress-row">
                                        <span><strong>{row.studentName}</strong><small>{row.studentEmail}</small></span>
                                        <span>{row.learnedWords}/{row.totalWords}</span>
                                        <span>{row.masteredWords}</span>
                                        <span>{row.weakWords}</span>
                                        <span>{row.accuracy}%</span>
                                        <span>{formatDateTime(row.lastStudiedAt)}</span>
                                        <span>{row.completionPercent}%</span>
                                        <button className="btn" onClick={() => setExpandedProgressStudentId(detailsOpen ? '' : row.studentId)} type="button">Chi tiet</button>
                                      </div>
                                      {detailsOpen ? (
                                        <div className="weak-word-detail-list">
                                          {(row.weakWordDetails ?? []).map((word) => (
                                            <div className="weak-word-detail" key={word.id}>
                                              <span><strong>{word.word}</strong>{word.meaningVi ? <small>{word.meaningVi}</small> : null}</span>
                                              <span>Wrong <strong>{word.wrongCount}</strong></span>
                                              <span>Confidence <strong>{word.confidence}</strong></span>
                                              <span>Last <strong>{formatDateTime(word.lastReviewedAt)}</strong></span>
                                            </div>
                                          ))}
                                          {(row.weakWordDetails ?? []).length === 0 ? <div className="notice">Khong co weak words.</div> : null}
                                        </div>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                  {!loadingAssignments && assignments.length === 0 ? <div className="notice">Chua co assignment nao cho bo tu nay.</div> : null}
                </div>
              </>
            ) : <div className="notice">Chon mot bo tu o ben trai de chinh sua.</div>}
          </section>
        </div>
      </section>
    </main>
  );
}




