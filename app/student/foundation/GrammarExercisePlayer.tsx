'use client';

import { Fragment, ReactNode, useEffect, useMemo, useState } from 'react';
import { studentApi } from '@/lib/api/student';

type ExerciseType = 'SINGLE_CHOICE' | 'FILL_BLANK' | 'REORDER_WORDS' | 'MATCHING' | 'ERROR_CORRECTION' | 'SHORT_SENTENCE';
type ExerciseState = 'NOT_STARTED' | 'ANSWERED' | 'CORRECT' | 'INCORRECT' | 'PENDING_GRADING' | 'COMPLETED';
type ChoiceOption = { id: string; content: string; orderIndex?: number };
type MatchingPair = { id: string; left: string; right: string; orderIndex?: number };
type BlankResult = { blankIndex: number; answer: string; isCorrect: boolean; score: number; maxScore: number; acceptedAnswers: string[]; explanation?: string };
type MatchResult = { leftId: string; rightId: string; correctRightId: string; left: string; right: string; correctRight: string; isCorrect: boolean; score: number; maxScore: number };
type ErrorCorrectionResult = { errorText: string; selectedErrorText?: string; acceptedAnswers: string[]; correctSentence: string };
type ShortSentenceResult = { gradingMode: 'AUTO_EXACT' | 'MANUAL'; sampleAnswer?: string; status: ExerciseState };
export type StudentGrammarExercise = { id: string; type: ExerciseType; instruction?: string; question: string; explanation?: string; hint?: string; score: number; orderIndex: number; options?: ChoiceOption[]; wordTokens?: string[]; matchingPairs?: MatchingPair[] };
type SavedExerciseState = { selectedOptionId: string; answer: string; blankAnswers: string[]; blankResults?: BlankResult[]; reorderTokenIds: number[]; reorderHistory: number[][]; correctOrder?: string[]; correctSentence?: string; matches: Record<string, string>; selectedLeftId?: string; matchResults?: MatchResult[]; errorSelection: string; correctionAnswer: string; errorResult?: ErrorCorrectionResult; status: ExerciseState; checked: boolean; hintVisible: boolean; correctOptionId?: string; score?: number; maxScore?: number; allowRetry?: boolean; shortResult?: ShortSentenceResult };
const emptyState: SavedExerciseState = { selectedOptionId: '', answer: '', blankAnswers: [], reorderTokenIds: [], reorderHistory: [], matches: {}, errorSelection: '', correctionAnswer: '', status: 'NOT_STARTED', checked: false, hintVisible: false, allowRetry: true };

function storageKey(studentKey: string, lessonId: string) { return `golden-pony-grammar-player:${studentKey || 'guest'}:${lessonId}`; }
function blankCount(question: string) { return (question.match(/\{\{blank\}\}/g) ?? []).length; }
function tokenText(tokens: string[], ids: number[]) { return ids.map((id) => tokens[id]).filter(Boolean); }
function shuffledTokenIds(tokens: string[]) { return tokens.map((_, index) => index).sort((a, b) => ((a * 37 + tokens[a].length * 11) % 97) - ((b * 37 + tokens[b].length * 11) % 97)); }
function sortedPairs(pairs?: MatchingPair[]) { return [...(pairs ?? [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)); }
function shuffledPairs(pairs: MatchingPair[]) { return [...pairs].sort((a, b) => ((a.id.charCodeAt(0) || 0) + a.right.length * 13) - ((b.id.charCodeAt(0) || 0) + b.right.length * 13)); }
function sentenceTokens(sentence: string) { return sentence.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*|[^\s]/gu) ?? []; }
function rendererLabel(type: ExerciseType) {
  if (type === 'SINGLE_CHOICE') return 'Chọn 1 đáp án rồi bấm Kiểm tra.';
  if (type === 'FILL_BLANK') return 'Điền vào từng ô trống rồi bấm Kiểm tra.';
  if (type === 'REORDER_WORDS') return 'Click token để xếp câu, hoặc kéo thả token trong câu trả lời.';
  if (type === 'MATCHING') return 'Chọn một mục bên trái rồi chọn mục bên phải để ghép cặp.';
  if (type === 'ERROR_CORRECTION') return 'Chọn phần sai hoặc nhập phần cần sửa, rồi nhập bản sửa đúng.';
  return 'Placeholder renderer cho type này sẽ được triển khai ở phase sau.';
}
function wordCount(value: string) { return value.trim() ? value.trim().split(/\s+/).length : 0; }
function highlightErrorText(sentence: string, errorText: string): ReactNode {
  const index = errorText ? sentence.indexOf(errorText) : -1;
  if (index < 0) return sentence;
  return <>{sentence.slice(0, index)}<mark className="error-highlight">{errorText}</mark>{sentence.slice(index + errorText.length)}</>;
}

export function GrammarExercisePlayer({ exercises, lessonId, studentKey, studentEmail }: { exercises: StudentGrammarExercise[]; lessonId: string; studentKey: string; studentEmail?: string }) {
  const sorted = useMemo(() => [...exercises].sort((a, b) => a.orderIndex - b.orderIndex), [exercises]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [states, setStates] = useState<Record<string, SavedExerciseState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dragAnswerIndex, setDragAnswerIndex] = useState<number | null>(null);
  const [dragRightId, setDragRightId] = useState('');

  useEffect(() => { try { const raw = window.localStorage.getItem(storageKey(studentKey, lessonId)); setStates(raw ? JSON.parse(raw) : {}); } catch { setStates({}); } }, [lessonId, studentKey]);
  useEffect(() => { window.localStorage.setItem(storageKey(studentKey, lessonId), JSON.stringify(states)); }, [states, lessonId, studentKey]);
  if (!sorted.length) return <div className="notice">Chưa có grammar exercise published.</div>;

  const exercise = sorted[Math.min(currentIndex, sorted.length - 1)];
  const state = states[exercise.id] || emptyState;
  const blanks = blankCount(exercise.question);
  const blankAnswers = Array.from({ length: blanks }, (_, index) => state.blankAnswers[index] || '');
  const reorderTokens = exercise.wordTokens ?? [];
  const reorderIds = state.reorderTokenIds.filter((id) => id >= 0 && id < reorderTokens.length);
  const poolIds = shuffledTokenIds(reorderTokens).filter((id) => !reorderIds.includes(id));
  const matchPairs = sortedPairs(exercise.matchingPairs);
  const rightPairs = shuffledPairs(matchPairs);
  const matchedCount = Object.keys(state.matches || {}).filter((leftId) => Boolean(state.matches[leftId])).length;
  const answeredCount = sorted.filter((item) => (states[item.id]?.status || 'NOT_STARTED') !== 'NOT_STARTED').length;
  const allCompleted = answeredCount === sorted.length;

  function update(next: Partial<SavedExerciseState>) { setStates((current) => ({ ...current, [exercise.id]: { ...emptyState, ...state, ...next } })); }
  function updateBlankAnswer(index: number, value: string) { const next = [...blankAnswers]; next[index] = value; update({ blankAnswers: next, status: next.some((answer) => answer.trim()) ? 'ANSWERED' : 'NOT_STARTED' }); }
  function setReorder(nextIds: number[], withHistory = true) { update({ reorderTokenIds: nextIds, reorderHistory: withHistory ? [...(state.reorderHistory || []), reorderIds] : state.reorderHistory, status: nextIds.length ? 'ANSWERED' : 'NOT_STARTED' }); }
  function addReorderToken(id: number) { if (state.checked || reorderIds.includes(id)) return; setReorder([...reorderIds, id]); }
  function removeReorderToken(index: number) { if (state.checked) return; setReorder(reorderIds.filter((_, i) => i !== index)); }
  function undoReorder() { const history = state.reorderHistory || []; const previous = history[history.length - 1]; if (!previous) return; update({ reorderTokenIds: previous, reorderHistory: history.slice(0, -1), status: previous.length ? 'ANSWERED' : 'NOT_STARTED' }); }
  function resetReorder() { update({ reorderTokenIds: [], reorderHistory: [], correctOrder: undefined, correctSentence: undefined, checked: false, status: 'NOT_STARTED', score: undefined, maxScore: undefined }); }
  function dropAnswerToken(targetIndex: number) { if (dragAnswerIndex === null || dragAnswerIndex === targetIndex || state.checked) return; const next = [...reorderIds]; const [moved] = next.splice(dragAnswerIndex, 1); next.splice(targetIndex, 0, moved); setDragAnswerIndex(null); setReorder(next); }
  function matchResult(leftId: string) { return state.matchResults?.find((item) => item.leftId === leftId); }
  function chooseLeft(leftId: string) { if (!state.checked) update({ selectedLeftId: state.selectedLeftId === leftId ? undefined : leftId }); }
  function chooseRight(rightId: string) { if (state.checked || !state.selectedLeftId) return; const next = { ...(state.matches || {}) }; Object.keys(next).forEach((leftId) => { if (next[leftId] === rightId) delete next[leftId]; }); next[state.selectedLeftId] = rightId; update({ matches: next, selectedLeftId: undefined, status: Object.keys(next).length ? 'ANSWERED' : 'NOT_STARTED' }); }
  function dropRightOnLeft(leftId: string) { if (!dragRightId || state.checked) return; const next = { ...(state.matches || {}) }; Object.keys(next).forEach((id) => { if (next[id] === dragRightId) delete next[id]; }); next[leftId] = dragRightId; setDragRightId(''); update({ matches: next, selectedLeftId: undefined, status: Object.keys(next).length ? 'ANSWERED' : 'NOT_STARTED' }); }
  function resetMatching() { update({ matches: {}, selectedLeftId: undefined, matchResults: undefined, checked: false, status: 'NOT_STARTED', score: undefined, maxScore: undefined }); }
  function resetErrorCorrection() { update({ errorSelection: '', correctionAnswer: '', errorResult: undefined, shortResult: undefined, checked: false, status: 'NOT_STARTED', score: undefined, maxScore: undefined }); }

  async function checkAnswer() {
    setError('');
    if (exercise.type === 'ERROR_CORRECTION') {
      if (!state.correctionAnswer.trim()) { setError('Nhập phần sửa trước khi kiểm tra.'); return; }
      try {
        setSubmitting(true);
        const res = await studentApi.submitGrammarExercise(exercise.id, { selectedErrorText: state.errorSelection, correctionAnswer: state.correctionAnswer }, studentEmail);
        const result = res.data as { isCorrect: boolean; score: number; maxScore: number; errorText: string; selectedErrorText?: string; acceptedAnswers: string[]; correctSentence: string };
        update({ checked: true, status: result.isCorrect ? 'CORRECT' : 'INCORRECT', errorResult: result, score: result.score, maxScore: result.maxScore });
      } catch (err) { setError(err instanceof Error ? err.message : 'Không kiểm tra được câu trả lời'); }
      finally { setSubmitting(false); }
      return;
    }
    if (exercise.type === 'SHORT_SENTENCE') {
      if (!state.answer.trim()) { setError('Nhập câu ngắn trước khi submit.'); return; }
      try { setSubmitting(true); const res = await studentApi.submitGrammarExercise(exercise.id, { answer: state.answer }, studentEmail); const result = res.data as { isCorrect: boolean; score: number; maxScore: number; status: ExerciseState; gradingMode: 'AUTO_EXACT' | 'MANUAL'; sampleAnswer?: string }; update({ checked: true, status: result.status, shortResult: result, score: result.score, maxScore: result.maxScore }); } catch (err) { setError(err instanceof Error ? err.message : 'Không submit được câu trả lời'); } finally { setSubmitting(false); }
      return;
    }
    if (exercise.type === 'MATCHING') {
      const matches = Object.entries(state.matches || {}).map(([leftId, rightId]) => ({ leftId, rightId }));
      if (matches.length !== matchPairs.length) { setError('Ghép đủ tất cả cặp trước khi kiểm tra.'); return; }
      try { setSubmitting(true); const res = await studentApi.submitGrammarExercise(exercise.id, { matches }, studentEmail); const result = res.data as { isCorrect: boolean; score: number; maxScore: number; matchResults: MatchResult[] }; update({ checked: true, status: result.isCorrect ? 'CORRECT' : 'INCORRECT', matchResults: result.matchResults, score: result.score, maxScore: result.maxScore }); } catch (err) { setError(err instanceof Error ? err.message : 'Không kiểm tra được câu trả lời'); } finally { setSubmitting(false); }
      return;
    }
    if (exercise.type === 'REORDER_WORDS') {
      const submittedOrder = tokenText(reorderTokens, reorderIds);
      if (submittedOrder.length !== reorderTokens.length) { setError('Sắp xếp đủ tất cả token trước khi kiểm tra.'); return; }
      try { setSubmitting(true); const res = await studentApi.submitGrammarExercise(exercise.id, { submittedOrder }, studentEmail); const result = res.data as { isCorrect: boolean; score: number; maxScore: number; correctOrder: string[]; correctSentence: string }; update({ checked: true, status: result.isCorrect ? 'CORRECT' : 'INCORRECT', correctOrder: result.correctOrder, correctSentence: result.correctSentence, score: result.score, maxScore: result.maxScore }); } catch (err) { setError(err instanceof Error ? err.message : 'Không kiểm tra được câu trả lời'); } finally { setSubmitting(false); }
      return;
    }
    if (exercise.type === 'FILL_BLANK') {
      if (!blankAnswers.length || blankAnswers.some((answer) => !answer.trim())) { setError('Điền tất cả ô trống trước khi kiểm tra.'); return; }
      try { setSubmitting(true); const res = await studentApi.submitGrammarExercise(exercise.id, { blankAnswers }, studentEmail); const result = res.data as { isCorrect: boolean; score: number; maxScore: number; blankResults: BlankResult[] }; update({ checked: true, status: result.isCorrect ? 'CORRECT' : 'INCORRECT', blankResults: result.blankResults, score: result.score, maxScore: result.maxScore }); } catch (err) { setError(err instanceof Error ? err.message : 'Không kiểm tra được câu trả lời'); } finally { setSubmitting(false); }
      return;
    }
    if (exercise.type !== 'SINGLE_CHOICE') { update({ checked: true, status: state.answer.trim() ? 'CORRECT' : 'INCORRECT' }); return; }
    if (!state.selectedOptionId) { setError('Chọn 1 đáp án trước khi kiểm tra.'); return; }
    try { setSubmitting(true); const res = await studentApi.submitGrammarExercise(exercise.id, { selectedOptionId: state.selectedOptionId }, studentEmail); const result = res.data as { isCorrect: boolean; score: number; maxScore: number; correctOptionId: string }; update({ checked: true, status: result.isCorrect ? 'CORRECT' : 'INCORRECT', correctOptionId: result.correctOptionId, score: result.score, maxScore: result.maxScore }); } catch (err) { setError(err instanceof Error ? err.message : 'Không kiểm tra được câu trả lời'); } finally { setSubmitting(false); }
  }

  function resetAnswer() { if (exercise.type === 'ERROR_CORRECTION') { resetErrorCorrection(); return; } if (exercise.type === 'MATCHING') { resetMatching(); return; } if (exercise.type === 'REORDER_WORDS') { resetReorder(); return; } update({ selectedOptionId: '', answer: '', blankAnswers: [], blankResults: undefined, reorderTokenIds: [], reorderHistory: [], correctOrder: undefined, correctSentence: undefined, matches: {}, selectedLeftId: undefined, matchResults: undefined, errorSelection: '', correctionAnswer: '', errorResult: undefined, shortResult: undefined, checked: false, hintVisible: false, status: 'NOT_STARTED', correctOptionId: undefined, score: undefined, maxScore: undefined }); }
  function next() { if (currentIndex < sorted.length - 1) setCurrentIndex((value) => value + 1); else if (allCompleted) update({ status: 'COMPLETED' }); }
  function optionClass(option: ChoiceOption) { if (!state.checked) return state.selectedOptionId === option.id ? 'test-list-button active' : 'test-list-button'; if (state.correctOptionId === option.id) return 'test-list-button active'; if (state.selectedOptionId === option.id) return 'test-list-button danger'; return 'test-list-button'; }
  function blankClass(index: number) { const result = state.blankResults?.find((item) => item.blankIndex === index); if (!state.checked || !result) return 'input fill-blank-input'; return `input fill-blank-input ${result.isCorrect ? 'correct' : 'incorrect'}`; }
  function renderFillBlankQuestion() { const parts = exercise.question.split('{{blank}}'); return <div className="fill-blank-question">{parts.map((part, index) => <Fragment key={index}>{part}{index < blanks ? <input className={blankClass(index)} value={blankAnswers[index] || ''} disabled={state.checked} onChange={(event) => updateBlankAnswer(index, event.target.value)} aria-label={`Blank ${index + 1}`} /> : null}</Fragment>)}</div>; }
  function renderReorderWords() { return <div className="reorder-player"><div className="reorder-answer" onDragOver={(event) => event.preventDefault()}>{reorderIds.length ? reorderIds.map((id, index) => <button className="reorder-token selected" key={`${id}-${index}`} type="button" draggable={!state.checked} onDragStart={() => setDragAnswerIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropAnswerToken(index)} onClick={() => removeReorderToken(index)}>{reorderTokens[id]}</button>) : <span className="muted">Câu trả lời của bạn sẽ hiện ở đây</span>}</div><div className="reorder-bank">{poolIds.map((id) => <button className="reorder-token" key={id} type="button" disabled={state.checked} onClick={() => addReorderToken(id)}>{reorderTokens[id]}</button>)}</div>{state.checked && state.correctSentence ? <div className="notice">Câu đúng: <strong>{state.correctSentence}</strong></div> : null}</div>; }
  function renderMatching() { return <div className="matching-player"><div className="row"><span className="badge">{matchedCount}/{matchPairs.length} cặp đã ghép</span></div><div className="matching-grid"><div className="matching-column">{matchPairs.map((pair) => { const result = matchResult(pair.id); const matchedRight = rightPairs.find((right) => right.id === state.matches?.[pair.id]); return <button className={`matching-card ${state.selectedLeftId === pair.id ? 'active' : ''} ${state.checked && result ? (result.isCorrect ? 'correct' : 'incorrect') : ''}`} key={pair.id} type="button" onClick={() => chooseLeft(pair.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropRightOnLeft(pair.id)}><strong>{pair.left}</strong><span>{matchedRight ? matchedRight.right : 'Chưa ghép'}</span>{state.checked && result && !result.isCorrect ? <small>Đúng: {result.correctRight}</small> : null}</button>; })}</div><div className="matching-column">{rightPairs.map((pair) => <button className="matching-card" key={pair.id} type="button" draggable={!state.checked} disabled={state.checked} onDragStart={() => setDragRightId(pair.id)} onClick={() => chooseRight(pair.id)}><strong>{pair.right}</strong></button>)}</div></div></div>; }
  function renderShortSentence() { return <div className="short-sentence-player"><textarea className="textarea" placeholder="Nhập câu ngắn của bạn" value={state.answer} disabled={state.checked} onChange={(event) => update({ answer: event.target.value, status: event.target.value.trim() ? 'ANSWERED' : 'NOT_STARTED' })} /><div className="row"><span className="badge">{wordCount(state.answer)} words</span>{state.checked && state.shortResult?.sampleAnswer ? <span className="badge">Sample: {state.shortResult.sampleAnswer}</span> : null}</div>{state.status === 'PENDING_GRADING' ? <div className="notice">Bài này đang chờ giáo viên chấm. Điểm hiện tại chưa được cộng.</div> : null}</div>; }
  function renderErrorCorrection() { return <div className="error-correction-player"><div className="error-correction-sentence">{state.checked && state.errorResult ? highlightErrorText(exercise.question, state.errorResult.errorText) : sentenceTokens(exercise.question).map((token, index) => <button className={`error-token ${state.errorSelection === token ? 'active' : ''}`} key={`${token}-${index}`} type="button" disabled={state.checked} onClick={() => update({ errorSelection: token, status: 'ANSWERED' })}>{token}</button>)}</div><input className="input" placeholder="Hoặc nhập phần sai" value={state.errorSelection} disabled={state.checked} onChange={(event) => update({ errorSelection: event.target.value, status: 'ANSWERED' })} /><input className="input" placeholder="Nhập phần sửa đúng" value={state.correctionAnswer} disabled={state.checked} onChange={(event) => update({ correctionAnswer: event.target.value, status: event.target.value.trim() ? 'ANSWERED' : 'NOT_STARTED' })} />{state.checked && state.errorResult ? <div className="notice"><strong>Câu đúng:</strong> {state.errorResult.correctSentence || state.errorResult.acceptedAnswers[0]}</div> : null}</div>; }

  return <section className="card item form grammar-player">
    <div className="row"><div><div className="eyebrow">Grammar Exercise {currentIndex + 1}/{sorted.length}</div><h3>{exercise.type}</h3></div><div className="actions"><span className="badge">{state.status}</span><span className="badge">{state.score ?? 0}/{state.maxScore ?? exercise.score} điểm</span></div></div>
    {exercise.instruction ? <div className="notice">{exercise.instruction}</div> : null}
    <div className="quick-box"><strong>{exercise.type === 'FILL_BLANK' ? renderFillBlankQuestion() : exercise.type === 'REORDER_WORDS' ? 'Sắp xếp các token thành câu đúng.' : exercise.question}</strong><p>{rendererLabel(exercise.type)}</p></div>
    {exercise.type === 'SINGLE_CHOICE' ? <div className="list">{(exercise.options ?? []).map((option) => <button className={optionClass(option)} key={option.id} type="button" onClick={() => !state.checked && update({ selectedOptionId: option.id, status: 'ANSWERED' })}><strong>{option.content}</strong>{state.checked && state.correctOptionId === option.id ? <span className="meta">Đáp án đúng</span> : null}{state.checked && state.selectedOptionId === option.id ? <span className="meta">Bạn đã chọn</span> : null}</button>)}</div> : null}
    {exercise.type === 'REORDER_WORDS' ? renderReorderWords() : null}
    {exercise.type === 'MATCHING' ? renderMatching() : null}
    {exercise.type === 'ERROR_CORRECTION' ? renderErrorCorrection() : null}
    {exercise.type === 'SHORT_SENTENCE' ? renderShortSentence() : null}
    {exercise.type !== 'SINGLE_CHOICE' && exercise.type !== 'FILL_BLANK' && exercise.type !== 'REORDER_WORDS' && exercise.type !== 'MATCHING' && exercise.type !== 'ERROR_CORRECTION' && exercise.type !== 'SHORT_SENTENCE' ? <textarea className="textarea" placeholder="Nhập câu trả lời của bạn" value={state.answer} onChange={(event) => update({ answer: event.target.value, status: event.target.value.trim() ? 'ANSWERED' : 'NOT_STARTED' })} /> : null}
    {state.checked && exercise.type === 'FILL_BLANK' && state.blankResults?.length ? <div className="list">{state.blankResults.map((result) => <div className={result.isCorrect ? 'notice fill-blank-result correct' : 'notice fill-blank-result incorrect'} key={result.blankIndex}><strong>Blank {result.blankIndex + 1}: {result.isCorrect ? 'Đúng' : 'Sai'}</strong><span>{result.score}/{result.maxScore} điểm</span><span>Đáp án đúng: {result.acceptedAnswers.join(', ')}</span>{result.explanation ? <span>{result.explanation}</span> : null}</div>)}</div> : null}
    {error ? <div className="error">{error}</div> : null}
    <div className="actions"><button className="btn primary" type="button" onClick={checkAnswer} disabled={submitting || state.checked}>{submitting ? 'Đang gửi...' : (exercise.type === 'SHORT_SENTENCE' ? 'Submit' : 'Kiểm tra')}</button><button className="btn" type="button" onClick={() => update({ hintVisible: true })}>Xem gợi ý</button>{exercise.type === 'REORDER_WORDS' ? <button className="btn" type="button" onClick={undoReorder} disabled={state.checked || !(state.reorderHistory || []).length}>Undo</button> : null}<button className="btn" type="button" onClick={resetAnswer}>{exercise.type === 'REORDER_WORDS' || exercise.type === 'MATCHING' || exercise.type === 'ERROR_CORRECTION' ? 'Reset' : 'Làm lại'}</button><button className="btn" type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}>Câu trước</button><button className="btn" type="button" disabled={currentIndex === sorted.length - 1 && !allCompleted} onClick={next}>Câu tiếp theo</button></div>
    {state.hintVisible ? <div className="notice">{exercise.hint || 'Exercise này chưa có gợi ý.'}</div> : null}
    {state.checked ? <div className="notice">{state.status === 'PENDING_GRADING' ? 'Đang chờ giáo viên chấm.' : state.status === 'CORRECT' ? 'Chính xác.' : 'Chưa đúng.'} {exercise.explanation || ''}</div> : null}
  </section>;
}