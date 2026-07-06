'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { AppHeader } from '@/app/components/AppHeader';
import { teacherApi } from '@/lib/api/teacher';

type QuestionType = 'single' | 'multiple' | 'true-false' | 'short-answer' | 'essay';
type TestItem = { title: string; description?: string; slug: string; status: string; durationMinutes?: number; maxAttempts?: number; questionCount?: number; attemptCount?: number };
type ServerQuestion = { id?: string; type?: string; prompt?: string; content?: string; options?: string[]; correctAnswer?: string | string[]; explanation?: string; points?: number };
type TestDetail = TestItem & { questions?: ServerQuestion[] };
type QuestionDraft = { localId: string; type: QuestionType; prompt: string; options: string[]; correctAnswers: string[]; textAnswer: string; explanation: string; points: number };
type EditState = { title: string; description: string; durationMinutes: number; maxAttempts: number; status: 'DRAFT' | 'PUBLISHED'; questions: QuestionDraft[] };

const typeLabels: Record<QuestionType, string> = { single: 'Một đáp án', multiple: 'Nhiều đáp án', 'true-false': 'Đúng / sai', 'short-answer': 'Trả lời ngắn', essay: 'Tự luận' };

function statusLabel(status: string) {
  return status.toLowerCase() === 'published' ? 'Đã đăng' : status.toLowerCase() === 'draft' ? 'Nháp' : status;
}

function normalizeType(type?: string): QuestionType {
  const value = (type || 'single').toLowerCase().replace('_', '-');
  if (value === 'multiple' || value === 'multiple-choice') return 'multiple';
  if (value === 'true-false') return 'true-false';
  if (value === 'short-answer') return 'short-answer';
  if (value === 'essay') return 'essay';
  return 'single';
}

function createQuestion(index: number): QuestionDraft {
  return { localId: `new-${Date.now()}-${index}`, type: 'single', prompt: '', options: ['A', 'B', 'C', 'D'], correctAnswers: ['A'], textAnswer: '', explanation: '', points: 1 };
}

function fromDetail(test: TestDetail): EditState {
  return {
    title: test.title,
    description: test.description || '',
    durationMinutes: test.durationMinutes ?? 40,
    maxAttempts: test.maxAttempts ?? 1,
    status: test.status.toLowerCase() === 'published' ? 'PUBLISHED' : 'DRAFT',
    questions: (test.questions?.length ? test.questions : [createQuestion(1)]).map((question, index) => {
      const type = normalizeType(question.type);
      const options = type === 'true-false' ? ['Đúng', 'Sai'] : type === 'short-answer' || type === 'essay' ? [] : question.options?.length ? question.options : ['A', 'B', 'C', 'D'];
      const correct = Array.isArray(question.correctAnswer) ? question.correctAnswer.map(String) : question.correctAnswer ? [String(question.correctAnswer)] : options[0] ? [options[0]] : [];
      return {
        localId: question.id || `q-${index}-${Date.now()}`,
        type,
        prompt: question.prompt || question.content || '',
        options,
        correctAnswers: type === 'short-answer' || type === 'essay' ? [] : correct,
        textAnswer: type === 'short-answer' || type === 'essay' ? String(question.correctAnswer || '') : '',
        explanation: question.explanation || '',
        points: question.points ?? 1,
      };
    }),
  };
}

function optionsForType(type: QuestionType, current: string[]) {
  if (type === 'true-false') return ['Đúng', 'Sai'];
  if (type === 'short-answer' || type === 'essay') return [];
  return current.length ? current : ['A', 'B', 'C', 'D'];
}

export default function TeacherTestsPage() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [edit, setEdit] = useState<EditState | null>(null);
  const [error, setError] = useState('');
  const [savingSlug, setSavingSlug] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function loadList(nextSelected = selectedSlug) {
    try {
      setError('');
      const res = await teacherApi.getTests();
      const nextTests = (res.data as TestItem[]) ?? [];
      setTests(nextTests);
      if (!nextSelected && nextTests[0]) openDetail(nextTests[0].slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được bài kiểm tra');
    }
  }

  async function openDetail(slug: string) {
    setSelectedSlug(slug);
    setLoadingDetail(true);
    setError('');
    try {
      const res = await teacherApi.getTest(slug);
      const detail = res.data as TestDetail | null;
      if (!detail) throw new Error('Không tìm thấy bài kiểm tra');
      setEdit(fromDetail(detail));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không mở được bài kiểm tra');
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => { loadList(''); }, []);

  function updateQuestion(localId: string, patch: Partial<QuestionDraft>) {
    if (!edit) return;
    setEdit({
      ...edit,
      questions: edit.questions.map((question) => {
        if (question.localId !== localId) return question;
        const nextType = patch.type ?? question.type;
        const nextOptions = patch.type ? optionsForType(nextType, question.options) : patch.options ?? question.options;
        const nextCorrect = patch.type ? nextType === 'short-answer' || nextType === 'essay' ? [] : [nextOptions[0] ?? ''] : patch.correctAnswers ?? question.correctAnswers;
        return { ...question, ...patch, options: nextOptions, correctAnswers: nextCorrect };
      }),
    });
  }

  function updateOption(localId: string, optionIndex: number, value: string) {
    if (!edit) return;
    setEdit({
      ...edit,
      questions: edit.questions.map((question) => {
        if (question.localId !== localId) return question;
        const previous = question.options[optionIndex];
        const options = question.options.map((option, index) => index === optionIndex ? value : option);
        const correctAnswers = question.correctAnswers.map((answer) => answer === previous ? value : answer);
        return { ...question, options, correctAnswers };
      }),
    });
  }

  function toggleCorrect(localId: string, option: string) {
    if (!edit || !option.trim()) return;
    setEdit({
      ...edit,
      questions: edit.questions.map((question) => {
        if (question.localId !== localId) return question;
        if (question.type === 'multiple') {
          const exists = question.correctAnswers.includes(option);
          return { ...question, correctAnswers: exists ? question.correctAnswers.filter((answer) => answer !== option) : [...question.correctAnswers, option] };
        }
        return { ...question, correctAnswers: [option] };
      }),
    });
  }

  function addOption(localId: string) {
    if (!edit) return;
    setEdit({ ...edit, questions: edit.questions.map((question) => question.localId === localId ? { ...question, options: [...question.options, ''] } : question) });
  }

  function removeOption(localId: string, optionIndex: number) {
    if (!edit) return;
    setEdit({
      ...edit,
      questions: edit.questions.map((question) => {
        if (question.localId !== localId || question.options.length <= 2) return question;
        const removed = question.options[optionIndex];
        const options = question.options.filter((_, index) => index !== optionIndex);
        const correctAnswers = question.correctAnswers.filter((answer) => answer !== removed);
        return { ...question, options, correctAnswers: correctAnswers.length ? correctAnswers : [options[0]] };
      }),
    });
  }

  function addQuestion() {
    if (!edit) return;
    setEdit({ ...edit, questions: [...edit.questions, createQuestion(edit.questions.length + 1)] });
  }

  function removeQuestion(localId: string) {
    if (!edit || edit.questions.length === 1) return;
    setEdit({ ...edit, questions: edit.questions.filter((question) => question.localId !== localId) });
  }

  function validate() {
    if (!edit) return 'Chưa chọn bài kiểm tra.';
    if (!edit.title.trim()) return 'Vui lòng nhập tên bài kiểm tra.';
    if (edit.durationMinutes < 1) return 'Thời gian làm bài phải lớn hơn 0.';
    if (edit.maxAttempts < 1) return 'Số lần làm tối đa phải lớn hơn 0.';
    for (const [index, question] of edit.questions.entries()) {
      if (!question.prompt.trim()) return `Câu ${index + 1} chưa có nội dung.`;
      if (question.type !== 'short-answer' && question.type !== 'essay') {
        const options = question.options.map((option) => option.trim()).filter(Boolean);
        if (options.length < 2) return `Câu ${index + 1} cần ít nhất 2 đáp án.`;
        if (!question.correctAnswers.some((answer) => options.includes(answer))) return `Câu ${index + 1} chưa chọn đáp án đúng.`;
      }
    }
    return '';
  }

  function payloadQuestions() {
    return (edit?.questions ?? []).map((question) => {
      const isTextType = question.type === 'short-answer' || question.type === 'essay';
      const options = question.options.map((option) => option.trim()).filter(Boolean);
      return {
        type: question.type,
        prompt: question.prompt.trim(),
        options: isTextType ? [] : options,
        correctAnswer: isTextType ? question.textAnswer.trim() : question.type === 'multiple' ? question.correctAnswers : question.correctAnswers[0],
        explanation: question.explanation.trim(),
        points: question.points,
      };
    });
  }

  async function saveDetail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!edit || !selectedSlug) return;
    setSavingSlug(selectedSlug);
    setError('');
    try {
      await teacherApi.updateTest(selectedSlug, { ...edit, questions: payloadQuestions() });
      await loadList(selectedSlug);
      await openDetail(selectedSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được bài kiểm tra');
    } finally {
      setSavingSlug('');
    }
  }

  async function updateStatus(slug: string, status: 'DRAFT' | 'PUBLISHED') {
    setSavingSlug(slug);
    setError('');
    try {
      await teacherApi.updateTest(slug, { status });
      await loadList(slug);
      if (slug === selectedSlug) setEdit((current) => current ? { ...current, status } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được trạng thái');
    } finally {
      setSavingSlug('');
    }
  }

  async function remove(slug: string) {
    if (!confirm('Xóa bài kiểm tra này?')) return;
    setSavingSlug(slug);
    setError('');
    try {
      await teacherApi.deleteTest(slug);
      setSelectedSlug('');
      setEdit(null);
      await loadList('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xóa được bài kiểm tra');
    } finally {
      setSavingSlug('');
    }
  }

  return (
    <main>
      <AppHeader role="teacher" />
      <section className="container">
        <div className="page-head">
          <div>
            <div className="eyebrow">Bài kiểm tra</div>
            <h1>Quản lý bài kiểm tra</h1>
            <p>Chọn bài để sửa thông tin, câu hỏi, đáp án đúng và trạng thái đăng/nháp.</p>
          </div>
          <div className="actions">
            <Link className="btn" href="/teacher/dashboard">Quay lại</Link>
            <Link className="btn primary" href="/teacher/tests/new">Tạo bài mới</Link>
          </div>
        </div>

        {error ? <div className="error" style={{ marginBottom: 14 }}>{error}</div> : null}

        <div className="teacher-manage-layout">
          <aside className="test-list-panel">
            {tests.map((test) => {
              const isPublished = test.status.toLowerCase() === 'published';
              return (
                <button className={selectedSlug === test.slug ? 'test-list-button active' : 'test-list-button'} key={test.slug} onClick={() => openDetail(test.slug)} type="button">
                  <div className="row" style={{ justifyContent: 'flex-start' }}>
                    <h3>{test.title}</h3>
                    <span className="badge">{statusLabel(test.status)}</span>
                  </div>
                  <div className="meta">
                    <span>{test.durationMinutes ?? 40} phút</span>
                    <span>{test.questionCount ?? 0} câu</span>
                    <span>{test.attemptCount ?? 0} lượt nộp</span>
                  </div>
                  <div className="test-card-actions">
                    <span className="btn soft">Sửa chi tiết</span>
                    {isPublished ? <span className="btn">Đang đăng</span> : <span className="btn">Bản nháp</span>}
                  </div>
                </button>
              );
            })}
            {!error && tests.length === 0 ? <div className="notice">Chưa có bài kiểm tra hoặc backend chưa chạy.</div> : null}
          </aside>

          <section className="card panel detail-editor">
            <div className="row">
              <div>
                <div className="eyebrow">Sửa chi tiết</div>
                <h2>{edit?.title || 'Chọn bài kiểm tra'}</h2>
              </div>
              {selectedSlug ? (
                <div className="actions">
                  <button className="btn" disabled={savingSlug === selectedSlug} onClick={() => updateStatus(selectedSlug, 'DRAFT')} type="button">Chuyển nháp</button>
                  <button className="btn primary" disabled={savingSlug === selectedSlug} onClick={() => updateStatus(selectedSlug, 'PUBLISHED')} type="button">Đăng bài</button>
                  <button className="btn danger" disabled={savingSlug === selectedSlug} onClick={() => remove(selectedSlug)} type="button">Xóa</button>
                </div>
              ) : null}
            </div>

            {loadingDetail ? <div className="notice">Đang mở bài kiểm tra...</div> : null}
            {edit ? (
              <form className="form" onSubmit={saveDetail}>
                <div className="compact-fields">
                  <label>Tên bài<input className="input" value={edit.title} onChange={(event) => setEdit({ ...edit, title: event.target.value })} /></label>
                  <label>Trạng thái<select className="select" value={edit.status} onChange={(event) => setEdit({ ...edit, status: event.target.value as 'DRAFT' | 'PUBLISHED' })}><option value="DRAFT">Nháp</option><option value="PUBLISHED">Đã đăng</option></select></label>
                  <label>Thời gian (phút)<input className="input" min={1} type="number" value={edit.durationMinutes} onChange={(event) => setEdit({ ...edit, durationMinutes: Number(event.target.value) })} /></label>
                  <label>Số lần làm<input className="input" min={1} type="number" value={edit.maxAttempts} onChange={(event) => setEdit({ ...edit, maxAttempts: Number(event.target.value) })} /></label>
                </div>
                <label>Mô tả<textarea className="textarea" value={edit.description} onChange={(event) => setEdit({ ...edit, description: event.target.value })} /></label>

                <div className="row" style={{ marginTop: 8 }}>
                  <div><div className="eyebrow">Ngân hàng câu trong bài</div><h2>{edit.questions.length} câu hỏi</h2></div>
                  <button className="btn" onClick={addQuestion} type="button">Thêm câu hỏi</button>
                </div>

                <div className="question-builder">
                  {edit.questions.map((question, questionIndex) => {
                    const isTextType = question.type === 'short-answer' || question.type === 'essay';
                    return (
                      <article className="card question-card" key={question.localId}>
                        <div className="row">
                          <h3>Câu {questionIndex + 1}</h3>
                          <button className="btn danger" disabled={edit.questions.length === 1} onClick={() => removeQuestion(question.localId)} type="button">Xóa câu</button>
                        </div>
                        <div className="compact-fields">
                          <label>Loại câu<select className="select" value={question.type} onChange={(event) => updateQuestion(question.localId, { type: event.target.value as QuestionType })}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                          <label>Điểm<input className="input" min={1} type="number" value={question.points} onChange={(event) => updateQuestion(question.localId, { points: Number(event.target.value) })} /></label>
                        </div>
                        <label>Nội dung câu hỏi<textarea className="textarea" value={question.prompt} onChange={(event) => updateQuestion(question.localId, { prompt: event.target.value })} /></label>
                        {!isTextType ? (
                          <div className="option-grid">
                            <div className="meta">Tick đáp án đúng. Câu nhiều đáp án có thể tick nhiều ô.</div>
                            {question.options.map((option, optionIndex) => (
                              <div className="option-row" key={`${question.localId}-${optionIndex}`}>
                                <input checked={question.correctAnswers.includes(option)} className="option-check" onChange={() => toggleCorrect(question.localId, option)} type={question.type === 'multiple' ? 'checkbox' : 'radio'} />
                                <input className="input" disabled={question.type === 'true-false'} value={option} onChange={(event) => updateOption(question.localId, optionIndex, event.target.value)} />
                                <button className="btn danger" disabled={question.type === 'true-false' || question.options.length <= 2} onClick={() => removeOption(question.localId, optionIndex)} type="button">Xóa</button>
                              </div>
                            ))}
                            {question.type !== 'true-false' ? <button className="btn" onClick={() => addOption(question.localId)} type="button">Thêm đáp án</button> : null}
                          </div>
                        ) : (
                          <label>Đáp án tham khảo<textarea className="textarea" value={question.textAnswer} onChange={(event) => updateQuestion(question.localId, { textAnswer: event.target.value })} /></label>
                        )}
                        <label>Giải thích<textarea className="textarea" value={question.explanation} onChange={(event) => updateQuestion(question.localId, { explanation: event.target.value })} /></label>
                      </article>
                    );
                  })}
                </div>

                <div className="actions">
                  <button className="btn primary" disabled={savingSlug === selectedSlug} type="submit">{savingSlug === selectedSlug ? 'Đang lưu...' : 'Lưu toàn bộ bài'}</button>
                </div>
              </form>
            ) : <div className="notice">Chọn một bài ở bên trái để mở editor chi tiết.</div>}
          </section>
        </div>
      </section>
    </main>
  );
}
