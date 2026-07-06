'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/app/components/AppHeader';
import { teacherApi } from '@/lib/api/teacher';

type QuestionType = 'single' | 'multiple' | 'true-false' | 'short-answer' | 'essay';
type QuestionDraft = {
  localId: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  correctAnswers: string[];
  textAnswer: string;
  explanation: string;
  points: number;
};

const typeLabels: Record<QuestionType, string> = {
  single: 'Một đáp án',
  multiple: 'Nhiều đáp án',
  'true-false': 'Đúng / sai',
  'short-answer': 'Trả lời ngắn',
  essay: 'Tự luận',
};

function createQuestion(index: number): QuestionDraft {
  return {
    localId: `${Date.now()}-${index}`,
    type: 'single',
    prompt: '',
    options: ['A', 'B', 'C', 'D'],
    correctAnswers: ['A'],
    textAnswer: '',
    explanation: '',
    points: 1,
  };
}

function optionsForType(type: QuestionType, current: string[]) {
  if (type === 'true-false') return ['Đúng', 'Sai'];
  if (type === 'short-answer' || type === 'essay') return [];
  return current.length ? current : ['A', 'B', 'C', 'D'];
}

export default function NewTestPage() {
  const router = useRouter();
  const [title, setTitle] = useState('Bài kiểm tra mới');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [questions, setQuestions] = useState<QuestionDraft[]>([createQuestion(1)]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateQuestion(localId: string, patch: Partial<QuestionDraft>) {
    setQuestions((current) => current.map((question) => {
      if (question.localId !== localId) return question;
      const nextType = patch.type ?? question.type;
      const nextOptions = patch.type ? optionsForType(nextType, question.options) : (patch.options ?? question.options);
      const nextCorrect = patch.type
        ? nextType === 'short-answer' || nextType === 'essay'
          ? []
          : [nextOptions[0] ?? '']
        : patch.correctAnswers ?? question.correctAnswers;
      return { ...question, ...patch, options: nextOptions, correctAnswers: nextCorrect };
    }));
  }

  function updateOption(localId: string, optionIndex: number, value: string) {
    setQuestions((current) => current.map((question) => {
      if (question.localId !== localId) return question;
      const previous = question.options[optionIndex];
      const options = question.options.map((option, index) => index === optionIndex ? value : option);
      const correctAnswers = question.correctAnswers.map((answer) => answer === previous ? value : answer);
      return { ...question, options, correctAnswers };
    }));
  }

  function addOption(localId: string) {
    setQuestions((current) => current.map((question) => question.localId === localId ? { ...question, options: [...question.options, ''] } : question));
  }

  function removeOption(localId: string, optionIndex: number) {
    setQuestions((current) => current.map((question) => {
      if (question.localId !== localId || question.options.length <= 2) return question;
      const removed = question.options[optionIndex];
      const options = question.options.filter((_, index) => index !== optionIndex);
      const correctAnswers = question.correctAnswers.filter((answer) => answer !== removed);
      return { ...question, options, correctAnswers: correctAnswers.length ? correctAnswers : [options[0]] };
    }));
  }

  function toggleCorrect(localId: string, option: string) {
    setQuestions((current) => current.map((question) => {
      if (question.localId !== localId) return question;
      if (question.type === 'multiple') {
        const exists = question.correctAnswers.includes(option);
        const correctAnswers = exists ? question.correctAnswers.filter((answer) => answer !== option) : [...question.correctAnswers, option];
        return { ...question, correctAnswers };
      }
      return { ...question, correctAnswers: [option] };
    }));
  }

  function removeQuestion(localId: string) {
    setQuestions((current) => current.length === 1 ? current : current.filter((question) => question.localId !== localId));
  }

  function addQuestion() {
    setQuestions((current) => [...current, createQuestion(current.length + 1)]);
  }

  function buildPayloadQuestions() {
    return questions.map((question) => {
      const trimmedOptions = question.options.map((option) => option.trim()).filter(Boolean);
      const isTextType = question.type === 'short-answer' || question.type === 'essay';
      return {
        type: question.type,
        prompt: question.prompt.trim(),
        options: isTextType ? [] : trimmedOptions,
        correctAnswer: isTextType ? question.textAnswer.trim() : question.type === 'multiple' ? question.correctAnswers : question.correctAnswers[0],
        explanation: question.explanation.trim(),
        points: question.points,
      };
    });
  }

  function validate() {
    if (!title.trim()) return 'Vui lòng nhập tên bài kiểm tra.';
    if (durationMinutes < 1) return 'Thời gian làm bài phải lớn hơn 0.';
    if (maxAttempts < 1) return 'Số lần làm tối đa phải lớn hơn 0.';
    for (const [index, question] of questions.entries()) {
      if (!question.prompt.trim()) return `Câu ${index + 1} chưa có nội dung.`;
      if (question.type !== 'short-answer' && question.type !== 'essay') {
        const options = question.options.map((option) => option.trim()).filter(Boolean);
        if (options.length < 2) return `Câu ${index + 1} cần ít nhất 2 đáp án.`;
        if (!question.correctAnswers.some((answer) => options.includes(answer))) return `Câu ${index + 1} chưa chọn đáp án đúng.`;
      }
    }
    return '';
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);
    try {
      await teacherApi.createTest({
        title: title.trim(),
        description: description.trim(),
        durationMinutes,
        maxAttempts,
        status,
        questions: buildPayloadQuestions(),
      });
      router.push('/teacher/tests');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được bài kiểm tra');
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
            <div className="eyebrow">Tạo bài</div>
            <h1>Bài kiểm tra mới</h1>
            <p>Thiết lập thông tin, thời gian, số lần làm và thêm câu hỏi trước khi đăng cho học sinh.</p>
          </div>
          <Link className="btn" href="/teacher/tests">Thoát</Link>
        </div>

        <form className="manager-layout" onSubmit={submit}>
          <section className="card panel form">
            <div className="eyebrow">Thông tin chung</div>
            <label>
              Tên bài
              <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label>
              Mô tả
              <textarea className="textarea" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mô tả ngắn để học sinh hiểu bài kiểm tra này dùng cho mục tiêu gì" />
            </label>
            <div className="compact-fields">
              <label>
                Thời gian (phút)
                <input className="input" min={1} type="number" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} />
              </label>
              <label>
                Số lần làm tối đa
                <input className="input" min={1} type="number" value={maxAttempts} onChange={(event) => setMaxAttempts(Number(event.target.value))} />
              </label>
            </div>
            <label>
              Trạng thái sau khi lưu
              <select className="select" value={status} onChange={(event) => setStatus(event.target.value as 'DRAFT' | 'PUBLISHED')}>
                <option value="DRAFT">Lưu nháp</option>
                <option value="PUBLISHED">Đăng bài</option>
              </select>
            </label>

            <div className="row" style={{ marginTop: 10 }}>
              <div>
                <div className="eyebrow">Câu hỏi</div>
                <h2>{questions.length} câu hỏi</h2>
              </div>
              <button className="btn" onClick={addQuestion} type="button">Thêm câu hỏi</button>
            </div>

            <div className="question-builder">
              {questions.map((question, questionIndex) => {
                const isTextType = question.type === 'short-answer' || question.type === 'essay';
                return (
                  <article className="card question-card" key={question.localId}>
                    <div className="row">
                      <h3>Câu {questionIndex + 1}</h3>
                      <button className="btn danger" disabled={questions.length === 1} onClick={() => removeQuestion(question.localId)} type="button">Xóa câu</button>
                    </div>

                    <div className="compact-fields">
                      <label>
                        Loại câu hỏi
                        <select className="select" value={question.type} onChange={(event) => updateQuestion(question.localId, { type: event.target.value as QuestionType })}>
                          {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </label>
                      <label>
                        Điểm
                        <input className="input" min={1} type="number" value={question.points} onChange={(event) => updateQuestion(question.localId, { points: Number(event.target.value) })} />
                      </label>
                    </div>

                    <label>
                      Nội dung câu hỏi
                      <textarea className="textarea" value={question.prompt} onChange={(event) => updateQuestion(question.localId, { prompt: event.target.value })} placeholder="Nhập câu hỏi" />
                    </label>

                    {!isTextType ? (
                      <div className="option-grid">
                        <div className="meta">Chọn ô bên trái để đánh dấu đáp án đúng.</div>
                        {question.options.map((option, optionIndex) => (
                          <div className="option-row" key={`${question.localId}-${optionIndex}`}>
                            <input
                              checked={question.correctAnswers.includes(option)}
                              className="option-check"
                              onChange={() => toggleCorrect(question.localId, option)}
                              type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                            />
                            <input className="input" disabled={question.type === 'true-false'} value={option} onChange={(event) => updateOption(question.localId, optionIndex, event.target.value)} />
                            <button className="btn danger" disabled={question.type === 'true-false' || question.options.length <= 2} onClick={() => removeOption(question.localId, optionIndex)} type="button">Xóa</button>
                          </div>
                        ))}
                        {question.type !== 'true-false' ? <button className="btn" onClick={() => addOption(question.localId)} type="button">Thêm đáp án</button> : null}
                      </div>
                    ) : (
                      <label>
                        Đáp án tham khảo
                        <textarea className="textarea" value={question.textAnswer} onChange={(event) => updateQuestion(question.localId, { textAnswer: event.target.value })} placeholder="Có thể để trống nếu giáo viên tự chấm" />
                      </label>
                    )}

                    <label>
                      Giải thích đáp án
                      <textarea className="textarea" value={question.explanation} onChange={(event) => updateQuestion(question.localId, { explanation: event.target.value })} placeholder="Hiển thị khi học sinh xem lại kết quả" />
                    </label>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="card panel editor-panel">
            <div className="eyebrow">Xuất bản</div>
            <div className="quick-box" style={{ marginTop: 14 }}>
              <p><strong>{title || 'Chưa đặt tên'}</strong></p>
              <p>{durationMinutes} phút · {maxAttempts} lần làm · {questions.length} câu</p>
              <p>Trạng thái: {status === 'PUBLISHED' ? 'Đã đăng' : 'Nháp'}</p>
            </div>
            {error ? <div className="error" style={{ marginTop: 14 }}>{error}</div> : null}
            <div className="actions" style={{ marginTop: 14 }}>
              <button className="btn primary" disabled={loading} type="submit">{loading ? 'Đang lưu...' : status === 'PUBLISHED' ? 'Lưu và đăng' : 'Lưu nháp'}</button>
              <Link className="btn" href="/teacher/tests">Hủy</Link>
            </div>
          </aside>
        </form>
      </section>
    </main>
  );
}
