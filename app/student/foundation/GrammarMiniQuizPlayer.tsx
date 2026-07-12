'use client';

import { useEffect, useMemo, useState } from 'react';
import { studentApi } from '@/lib/api/student';
import { GrammarExercisePlayer, StudentGrammarExercise } from './GrammarExercisePlayer';

type QuizItem = { id: string; orderIndex: number; exercise: StudentGrammarExercise };
type Quiz = { id: string; title: string; passScore: number; maxAttempts: number; showExplanationMode: string; remainingAttempts?: number; items: QuizItem[] };
type Attempt = { id: string; status: string; score?: number; maxScore?: number; correctCount?: number; incorrectCount?: number; unansweredCount?: number; percentage?: number; passed?: boolean; review?: any[]; answers?: Record<string, any> };

function blankCount(question: string) { return (question.match(/\{\{blank\}\}/g) ?? []).length; }
function words(value: string) { return value.trim() ? value.trim().split(/\s+/).length : 0; }

export function GrammarMiniQuizPlayer({ blockId, exercises, lessonId, studentKey, studentEmail }: { blockId: string; exercises: StudentGrammarExercise[]; lessonId: string; studentKey: string; studentEmail?: string }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const items = useMemo(() => [...(quiz?.items ?? [])].sort((a, b) => a.orderIndex - b.orderIndex), [quiz]);
  const current = items[index]?.exercise;

  useEffect(() => { load(); }, [blockId, studentEmail]);
  useEffect(() => {
    if (!attempt || attempt.status !== 'IN_PROGRESS') return;
    const id = window.setTimeout(() => studentApi.autosaveGrammarMiniQuiz(attempt.id, answers).catch(() => undefined), 500);
    return () => window.clearTimeout(id);
  }, [answers, attempt?.id, attempt?.status]);

  async function load() {
    try { setLoading(true); setError(''); const res = await studentApi.getGrammarMiniQuiz(blockId, studentEmail); setQuiz(res.data as Quiz); }
    catch { setQuiz(null); }
    finally { setLoading(false); }
  }

  async function start() {
    if (!quiz) return;
    try { setSaving(true); setError(''); const res = await studentApi.startGrammarMiniQuiz(quiz.id, studentEmail); const next = res.data as Attempt; setAttempt(next); setAnswers((next.answers ?? {}) as Record<string, any>); setIndex(0); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không start được mini quiz'); }
    finally { setSaving(false); }
  }

  function answerFor(id: string) { return answers[id] || {}; }
  function setAnswer(id: string, value: any) { setAnswers((current) => ({ ...current, [id]: value })); }

  async function submit() {
    if (!attempt) return;
    if (!window.confirm('Submit mini quiz? Bạn sẽ không sửa được sau khi nộp.')) return;
    try { setSaving(true); setError(''); const res = await studentApi.submitGrammarMiniQuiz(attempt.id, answers); setAttempt(res.data as Attempt); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không submit được mini quiz'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="notice">Đang tải mini quiz...</div>;
  if (!quiz) return <GrammarExercisePlayer exercises={exercises} lessonId={lessonId} studentKey={studentKey} studentEmail={studentEmail} />;
  if (!attempt) return <section className="card item form grammar-player"><div className="row"><div><div className="eyebrow">Grammar Mini Quiz</div><h3>{quiz.title}</h3></div><span className="badge">Pass {quiz.passScore}%</span></div><p>{items.length} câu · tối đa {quiz.maxAttempts} lượt làm · còn {quiz.remainingAttempts ?? quiz.maxAttempts} lượt</p>{error ? <div className="error">{error}</div> : null}<button className="btn primary" type="button" disabled={saving || (quiz.remainingAttempts ?? 1) <= 0} onClick={start}>Start quiz</button></section>;
  if (attempt.status === 'SUBMITTED') return <section className="card item form grammar-player"><div className="row"><div><div className="eyebrow">Quiz Summary</div><h3>{attempt.passed ? 'Passed' : 'Failed'}</h3></div><span className="badge">{Math.round(attempt.percentage ?? 0)}%</span></div><div className="compact-fields"><span className="badge">Score {attempt.score}/{attempt.maxScore}</span><span className="badge">Đúng {attempt.correctCount}</span><span className="badge">Sai {attempt.incorrectCount}</span><span className="badge">Chưa làm {attempt.unansweredCount}</span></div><div className="list">{(attempt.review ?? []).map((row, i) => <div className="notice" key={row.exerciseId || i}><strong>{i + 1}. {row.status}</strong><span> {row.score}/{row.maxScore} điểm</span>{quiz.showExplanationMode !== 'NEVER' && row.exercise?.explanation ? <p>{row.exercise.explanation}</p> : null}</div>)}</div>{attempt.passed ? null : <button className="btn" type="button" disabled={saving} onClick={() => { setAttempt(null); setAnswers({}); load(); }}>Làm lại nếu còn lượt</button>}</section>;

  const answer = current ? answerFor(current.id) : {};
  return <section className="card item form grammar-player"><div className="row"><div><div className="eyebrow">Question {index + 1}/{items.length}</div><h3>{current?.type}</h3></div><span className="badge">Autosave</span></div><div className="actions">{items.map((item, i) => <button className={answers[item.exercise.id] ? 'btn primary' : 'btn'} key={item.id} type="button" onClick={() => setIndex(i)}>{i + 1}</button>)}</div>{current ? <div className="quick-box"><strong>{current.question}</strong><p>{current.instruction}</p></div> : null}{current?.type === 'SINGLE_CHOICE' ? <div className="list">{(current.options ?? []).map((option) => <button className={answer.selectedOptionId === option.id ? 'test-list-button active' : 'test-list-button'} key={option.id} type="button" onClick={() => setAnswer(current.id, { selectedOptionId: option.id })}>{option.content}</button>)}</div> : null}{current?.type === 'FILL_BLANK' ? <div className="list">{Array.from({ length: blankCount(current.question) }, (_, i) => <input className="input" key={i} placeholder={`Blank ${i + 1}`} value={(answer.blankAnswers ?? [])[i] || ''} onChange={(e) => { const next = [...(answer.blankAnswers ?? [])]; next[i] = e.target.value; setAnswer(current.id, { blankAnswers: next }); }} />)}</div> : null}{current && !['SINGLE_CHOICE','FILL_BLANK'].includes(current.type) ? <div className="list"><textarea className="textarea" placeholder="Câu trả lời" value={answer.answer || answer.correctionAnswer || ''} onChange={(e) => setAnswer(current.id, current.type === 'ERROR_CORRECTION' ? { ...answer, correctionAnswer: e.target.value } : { answer: e.target.value })} />{current.type === 'SHORT_SENTENCE' ? <span className="badge">{words(answer.answer || '')} words</span> : null}</div> : null}{error ? <div className="error">{error}</div> : null}<div className="actions"><button className="btn" type="button" disabled={index === 0} onClick={() => setIndex((v) => Math.max(0, v - 1))}>Câu trước</button><button className="btn" type="button" disabled={index === items.length - 1} onClick={() => setIndex((v) => Math.min(items.length - 1, v + 1))}>Câu tiếp theo</button><button className="btn primary" type="button" disabled={saving} onClick={submit}>Submit quiz</button></div></section>;
}