'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/app/components/AppHeader';
import { studentApi } from '@/lib/api/student';

type QuestionType = 'single' | 'multiple' | 'true-false' | 'short-answer' | 'essay';
type StudentQuestion = { id: string; type: QuestionType; prompt: string; content?: string; options?: string[]; explanation?: string };
type StudentTest = { id: string; title: string; description: string; teacher: string; durationMinutes: number; questionCount: number; progress?: number; deadline?: string; questions?: StudentQuestion[] };
type Attempt = { attemptId: string; testId: string; status: string };
type ResultAnswer = { questionId: string; selectedAnswer: string | string[]; correctAnswer: string | string[]; isCorrect: boolean; explanation?: string };
type SubmitResult = { attemptId: string; correctCount: number; totalQuestions: number; score: number; maxScore: number; answers: ResultAnswer[] };
type Answers = Record<string, string | string[]>;

function statusText(progress?: number) {
  return progress ? 'Đang làm' : 'Chưa bắt đầu';
}

function normalizeType(type?: string): QuestionType {
  if (type === 'multiple' || type === 'true-false' || type === 'short-answer' || type === 'essay') return type;
  return 'single';
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const rest = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
}

function optionPrefix(index: number) {
  return String.fromCharCode(65 + index);
}

function toAnswerList(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.map(String);
  if (!value) return [];
  const text = String(value).trim();
  if (text.startsWith('[') && text.endsWith(']')) {
    return text.slice(1, -1).split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [text];
}

function sameAnswer(option: string, value: string | string[] | undefined) {
  return toAnswerList(value).includes(option);
}

export default function StudentTestsPage() {
  const [tests, setTests] = useState<StudentTest[]>([]);
  const [error, setError] = useState('');
  const [loadingId, setLoadingId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTest, setActiveTest] = useState<StudentTest | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [reviewIds, setReviewIds] = useState<string[]>([]);

  useEffect(() => {
    studentApi.getTests()
      .then((res) => setTests((res.data as StudentTest[]) ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được bài kiểm tra'));
  }, []);

  useEffect(() => {
    if (!activeTest || result || remainingSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeTest, result, remainingSeconds]);

  useEffect(() => {
    if (activeTest && attempt && !result && !submitting && remainingSeconds === 0) {
      submitTest();
    }
  }, [remainingSeconds, activeTest, attempt, result, submitting]);

  const resultByQuestion = useMemo(() => {
    const map = new Map<string, ResultAnswer>();
    result?.answers?.forEach((answer) => map.set(answer.questionId, answer));
    return map;
  }, [result]);

  async function startTest(testId: string) {
    setError('');
    setResult(null);
    setLoadingId(testId);
    try {
      const [testResponse, attemptResponse] = await Promise.all([
        studentApi.getTest(testId),
        studentApi.startTest(testId),
      ]);
      const test = testResponse.data as StudentTest | null;
      const newAttempt = attemptResponse.data as Attempt | null;
      if (!test || !newAttempt) throw new Error('Không mở được bài kiểm tra.');
      setActiveTest(test);
      setAttempt(newAttempt);
      setAnswers({});
      setReviewIds([]);
      setRemainingSeconds(Math.max(1, test.durationMinutes || 1) * 60);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không mở được bài kiểm tra');
    } finally {
      setLoadingId('');
    }
  }

  function chooseSingle(questionId: string, value: string) {
    if (result) return;
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function toggleMultiple(questionId: string, value: string) {
    if (result) return;
    setAnswers((current) => {
      const selected = Array.isArray(current[questionId]) ? current[questionId] as string[] : [];
      const next = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
      return { ...current, [questionId]: next };
    });
  }

  function toggleReview(questionId: string) {
    setReviewIds((current) => current.includes(questionId) ? current.filter((id) => id !== questionId) : [...current, questionId]);
  }

  function jumpToQuestion(questionId: string) {
    document.getElementById(`question-${questionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function submitTest() {
    if (!activeTest || !attempt || submitting || result) return;
    setError('');
    setSubmitting(true);
    try {
      const response = await studentApi.submitTest(activeTest.id, {
        attemptId: attempt.attemptId,
        answers,
      });
      setResult(response.data as SubmitResult);
      setRemainingSeconds(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không nộp được bài kiểm tra');
    } finally {
      setSubmitting(false);
    }
  }

  if (activeTest) {
    const questions = activeTest.questions ?? [];
    const answeredCount = questions.filter((question) => {
      const answer = answers[question.id];
      return Array.isArray(answer) ? answer.length > 0 : Boolean(answer);
    }).length;
    const wrongCount = result ? Math.max(0, result.totalQuestions - result.correctCount) : 0;

    return (
      <main className="study-exam-page">
        <header className="study-exam-topbar">
          <Link className="brand" href="/student/dashboard"><span className="logo">GS</span><span>Giáo Sư</span></Link>
          <nav className="nav"><span className="role-label">Học sinh</span><button className="btn" onClick={() => setActiveTest(null)} type="button">Thoát</button></nav>
        </header>

        <section className="study-exam-title">
          <h1>{activeTest.title}</h1>
          <button className="btn" onClick={() => setActiveTest(null)} type="button">Thoát</button>
        </section>

        {error ? <div className="container"><div className="error">{error}</div></div> : null}
        {result ? (
          <div className="container">
            <div className="result-summary">
              <div><span>Câu đúng</span><strong>{result.correctCount}</strong></div>
              <div><span>Câu sai</span><strong>{wrongCount}</strong></div>
              <div><span>Điểm</span><strong>{result.score}/{result.maxScore}</strong></div>
            </div>
          </div>
        ) : null}

        <section className="study-exam-shell">
          <div className="study-question-panel">
            <div className="study-tools"><span className="study-toggle" /> <em>Highlight nội dung</em><span className="study-help">i</span></div>
            <div className="study-part">Phần 1</div>
            {questions.map((question, questionIndex) => {
              const type = normalizeType(question.type);
              const selected = answers[question.id];
              const isReview = reviewIds.includes(question.id);
              const questionResult = resultByQuestion.get(question.id);
              return (
                <article className={questionResult?.isCorrect === false ? 'study-question wrong-question' : 'study-question'} id={`question-${question.id}`} key={question.id}>
                  <div className="study-question-number">{questionIndex + 1}</div>
                  <div className="study-question-body">
                    <div className="study-question-head">
                      <h2>{question.prompt || question.content}</h2>
                      <button className={isReview ? 'btn primary' : 'btn'} onClick={() => toggleReview(question.id)} type="button">Review</button>
                    </div>

                    {(type === 'single' || type === 'true-false' || type === 'multiple') ? (
                      <div className="study-options">
                        {(question.options ?? []).map((option, optionIndex) => {
                          const chosen = type === 'multiple' ? Array.isArray(selected) && selected.includes(option) : selected === option;
                          const correct = sameAnswer(option, questionResult?.correctAnswer);
                          const wrongSelected = Boolean(result && chosen && !correct);
                          const optionClass = result
                            ? correct
                              ? 'study-option correct-answer'
                              : wrongSelected
                                ? 'study-option wrong-answer'
                                : 'study-option muted-answer'
                            : 'study-option';
                          return (
                            <label className={optionClass} key={`${question.id}-${optionIndex}`}>
                              <input checked={chosen} disabled={Boolean(result)} onChange={() => type === 'multiple' ? toggleMultiple(question.id, option) : chooseSingle(question.id, option)} type={type === 'multiple' ? 'checkbox' : 'radio'} />
                              <span>{optionPrefix(optionIndex)}. {option}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : null}

                    {(type === 'short-answer' || type === 'essay') ? (
                      <div className="text-result-block">
                        <textarea className="textarea" disabled={Boolean(result)} onChange={(event) => chooseSingle(question.id, event.target.value)} placeholder="Nhập câu trả lời" value={typeof selected === 'string' ? selected : ''} />
                        {questionResult ? (
                          <div className={questionResult.isCorrect ? 'text-answer-review correct-answer' : 'text-answer-review wrong-answer'}>
                            <strong>Đáp án của bạn:</strong> {toAnswerList(questionResult.selectedAnswer).join(', ') || 'Chưa trả lời'}<br />
                            <strong>Đáp án đúng:</strong> {toAnswerList(questionResult.correctAnswer).join(', ') || 'Giáo viên tự chấm'}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {questionResult ? (
                      <div className={questionResult.isCorrect ? 'question-feedback correct' : 'question-feedback wrong'}>
                        {questionResult.isCorrect ? 'Đúng' : 'Sai'}{questionResult.explanation ? ` · ${questionResult.explanation}` : ''}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
            {questions.length === 0 ? <div className="notice">Bài kiểm tra này chưa có câu hỏi.</div> : null}
          </div>

          <aside className="study-sidebar">
            <div className="study-time-label">Thời gian làm bài:</div>
            <div className={remainingSeconds <= 60 && !result ? 'study-timer danger-time' : 'study-timer'}>{formatTimer(remainingSeconds)}</div>
            <button className="study-submit" disabled={Boolean(result) || submitting} onClick={submitTest} type="button">{submitting ? 'ĐANG NỘP...' : result ? 'ĐÃ NỘP' : 'NỘP BÀI'}</button>
            <button className="study-restore" type="button">Khôi phục/lưu bài làm ›</button>
            <p className="study-note">Chú ý: bạn có thể click vào số thứ tự câu hỏi trong bài để đánh dấu review</p>
            {result ? <div className="study-result-mini">Đúng {result.correctCount} · Sai {wrongCount} · Điểm {result.score}/{result.maxScore}</div> : null}
            <h3>Phần 1</h3>
            <div className="study-question-grid">
              {questions.map((question, index) => {
                const answer = answers[question.id];
                const done = Array.isArray(answer) ? answer.length > 0 : Boolean(answer);
                const review = reviewIds.includes(question.id);
                const questionResult = resultByQuestion.get(question.id);
                const className = questionResult ? questionResult.isCorrect ? 'correct' : 'wrong' : review ? 'review' : done ? 'done' : '';
                return <button className={className} key={question.id} onClick={() => jumpToQuestion(question.id)} type="button">{index + 1}</button>;
              })}
            </div>
            <div className="meta" style={{ marginTop: 14 }}><span>{answeredCount}/{questions.length} đã trả lời</span><span>{reviewIds.length} review</span></div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main>
      <AppHeader role="student" />
      <section className="container">
        <div className="page-head">
          <div><div className="eyebrow">Học sinh</div><h1>Danh sách bài kiểm tra</h1><p>Xem các bài giáo viên đã đăng, trạng thái hiện tại và tiến độ của bạn.</p></div>
          <div className="actions"><Link className="btn" href="/student/dashboard">Quay lại dashboard</Link><button className="btn primary" type="button">Vào bài bằng mã</button></div>
        </div>
        {error ? <div className="error">{error}</div> : null}
        <div className="list">
          {tests.map((test) => (
            <article className="card list-item" key={test.id}>
              <div><div className="row" style={{ justifyContent: 'flex-start' }}><h3>{test.title}</h3><span className="badge">{statusText(test.progress)}</span></div><p>{test.description}</p><div className="meta"><span>{test.teacher}</span><span><strong>{test.durationMinutes}</strong> phút</span><span><strong>{test.questionCount}</strong> câu</span><span>Tiến độ <strong>{test.progress ?? 0}%</strong></span>{test.deadline ? <span>Hạn nộp <strong>{new Date(test.deadline).toLocaleDateString('vi-VN')}</strong></span> : null}</div></div>
              <button className="btn primary" disabled={loadingId === test.id} onClick={() => startTest(test.id)} type="button">{loadingId === test.id ? 'Đang mở...' : 'Bắt đầu làm'}</button>
            </article>
          ))}
          {!error && tests.length === 0 ? <div className="notice">Chưa có bài kiểm tra hoặc backend chưa chạy.</div> : null}
        </div>
      </section>
    </main>
  );
}
