'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Award, Brain, CheckCircle2, Flame, Gauge, RotateCcw, Smile, Volume2 } from 'lucide-react';
import { AppHeader } from '@/app/components/AppHeader';
import { getClientAuthUser } from '@/lib/client-auth';
import { studentApi } from '@/lib/api/student';

type Progress = {
  status: string;
  confidence: number;
  correctCount: number;
  wrongCount: number;
  lastReviewedAt?: string | null;
  nextReviewAt?: string | null;
};

type FlashcardItem = {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaningVi?: string;
  meaningEn?: string;
  exampleSentence?: string;
  exampleMeaningVi?: string;
  tags?: string[];
  progress?: Progress;
};

type StudentVocabularyAssignment = {
  id: string;
  title: string;
  deadline?: string;
  dailyTarget: number;
  requiredMasteryPercent: number;
  assignedAt?: string;
  setId?: string;
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
  items?: FlashcardItem[];
};

type ReviewAction = 'HARD' | 'MEDIUM' | 'EASY' | 'MASTERED' | 'MC_CORRECT' | 'MC_WRONG';
type FlashcardMode = 'new' | 'review' | 'choice';

type SavedSession = {
  assignmentId: string;
  mode: FlashcardMode;
  activeIndex: number;
};

const SESSION_STORAGE_KEY = 'golden-pony-vocabulary-session';

function formatDateTime(value?: string | null) {
  if (!value) return 'Khong co han';
  return new Date(value).toLocaleString('vi-VN');
}

function progressStatus(progress?: Progress) {
  if (!progress) return 'NEW';
  return progress.status || 'NEW';
}

function isMastered(item: FlashcardItem) {
  return item.progress?.status === 'MASTERED';
}

function progressPercent(mastered: number, total: number) {
  if (!total) return 0;
  return Math.round((mastered / total) * 100);
}

function clampIndex(index: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(index, total - 1));
}

function readSavedSession(): SavedSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSession;
    if (!parsed.assignmentId || (parsed.mode !== 'new' && parsed.mode !== 'review' && parsed.mode !== 'choice')) return null;
    return { assignmentId: parsed.assignmentId, mode: parsed.mode, activeIndex: Number(parsed.activeIndex) || 0 };
  } catch {
    return null;
  }
}

function saveSession(session: SavedSession) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearSavedSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

function scheduleAfterReview(ids: string[], activeIndex: number, itemId: string, action: ReviewAction, mastered: boolean) {
  const remaining = ids.filter((id) => id !== itemId);
  if (mastered) return { ids: remaining, index: clampIndex(activeIndex, remaining.length) };

  const spacing = action === 'HARD' ? 1 : action === 'MEDIUM' ? 3 : 6;
  const insertAt = Math.min(activeIndex + spacing, remaining.length);
  const nextIds = [...remaining.slice(0, insertAt), itemId, ...remaining.slice(insertAt)];
  return { ids: nextIds, index: clampIndex(activeIndex, nextIds.length) };
}

function speakWord(word?: string) {
  if (typeof window === 'undefined' || !word || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  utterance.rate = 0.86;
  window.speechSynthesis.speak(utterance);
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

type ChoiceFeedback = {
  selected: string;
  correct: boolean;
};

function answerText(item: FlashcardItem) {
  return item.meaningVi || 'Chua co nghia tieng Viet';
}

function multipleChoiceOptions(activeItem: FlashcardItem | null, allItems: FlashcardItem[]) {
  if (!activeItem) return [];
  const correct = answerText(activeItem);
  const wrongOptions = allItems
    .filter((item) => item.id !== activeItem.id)
    .map(answerText)
    .filter((meaning) => meaning && meaning !== correct)
    .filter((meaning, index, source) => source.indexOf(meaning) === index)
    .slice(0, 3);
  const options = [correct, ...wrongOptions];
  return options.sort((a, b) => {
    const seed = activeItem.id.charCodeAt((a.length + b.length) % activeItem.id.length) || 0;
    return (a.length + seed) % 7 - ((b.length + seed) % 7);
  });
}

export default function StudentVocabularyPage() {
  const [assignments, setAssignments] = useState<StudentVocabularyAssignment[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<StudentVocabularyAssignment | null>(null);
  const [sessionMode, setSessionMode] = useState<FlashcardMode>('new');
  const [sessionItemIds, setSessionItemIds] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [choiceFeedback, setChoiceFeedback] = useState<ChoiceFeedback | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingAssignmentId, setLoadingAssignmentId] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [sessionReviewed, setSessionReviewed] = useState(0);
  const [sessionMastered, setSessionMastered] = useState(0);
  const [sessionWeakIds, setSessionWeakIds] = useState<string[]>([]);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const restoredSessionRef = useRef(false);

  const userEmail = getClientAuthUser()?.email;
  const allItems = activeAssignment?.items ?? [];
  const itemsById = useMemo(() => new Map(allItems.map((item) => [item.id, item])), [allItems]);
  const sessionItems = useMemo(
    () => sessionItemIds.map((id) => itemsById.get(id)).filter((item): item is FlashcardItem => Boolean(item)),
    [itemsById, sessionItemIds]
  );
  const activeItem = sessionItems[activeIndex] ?? null;
  const masteredCount = useMemo(() => allItems.filter(isMastered).length, [allItems]);
  const totalCount = allItems.length;
  const learnedPercent = progressPercent(masteredCount, totalCount);
  const remainingNewCount = Math.max(0, totalCount - masteredCount);
  const reviewedCount = useMemo(
    () => allItems.reduce((total, item) => total + (item.progress?.correctCount ?? 0) + (item.progress?.wrongCount ?? 0), 0),
    [allItems]
  );
  const xp = masteredCount * 20 + reviewedCount * 3;
  const streak = Math.max(0, masteredCount || Math.min(reviewedCount, 7));
  const badgeLabel = learnedPercent === 100 ? 'Master badge' : remainingNewCount + ' left';
  const sessionAccuracy = sessionReviewed ? Math.round((sessionCorrect / sessionReviewed) * 100) : 0;
  const weakWords = useMemo(() => allItems.filter((item) => sessionWeakIds.includes(item.id)), [allItems, sessionWeakIds]);
  const choiceOptions = useMemo(() => multipleChoiceOptions(activeItem, allItems), [activeItem, allItems]);

  function resetSessionStats() {
    setSessionReviewed(0);
    setSessionMastered(0);
    setSessionWeakIds([]);
    setSessionCorrect(0);
    setSessionWrong(0);
    setSessionXp(0);
  }
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

  useEffect(() => {
    if (loading || restoredSessionRef.current || activeAssignment) return;
    const saved = readSavedSession();
    if (!saved) return;
    restoredSessionRef.current = true;
    openAssignment(saved.assignmentId, saved.mode, saved.activeIndex, true);
  }, [loading, activeAssignment]);

  useEffect(() => {
    if (!activeAssignment) return;
    saveSession({ assignmentId: activeAssignment.id, mode: sessionMode, activeIndex });
  }, [activeAssignment, sessionMode, activeIndex]);

  async function openAssignment(assignmentId: string, mode: FlashcardMode = 'new', restoreIndex = 0, silent = false) {
    setLoadingAssignmentId(assignmentId);
    setError('');
    try {
      const res = await studentApi.getVocabularyAssignment(assignmentId, userEmail);
      const data = res.data as StudentVocabularyAssignment | null;
      if (!data) throw new Error('Khong mo duoc bo tu vung.');
      const loadedItems = data.items ?? [];
      const nextSessionItems = mode === 'new' ? loadedItems.filter((item) => !isMastered(item)) : loadedItems;
      setActiveAssignment(data);
      setSessionMode(mode);
      setSessionItemIds(nextSessionItems.map((item) => item.id));
      setActiveIndex(clampIndex(restoreIndex, nextSessionItems.length));
      setShowBack(false);
      setAnswerRevealed(false);
      setAdvancing(false);
      resetSessionStats();
      if (!silent) window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      clearSavedSession();
      setError(err instanceof Error ? err.message : 'Khong mo duoc flashcard');
    } finally {
      setLoadingAssignmentId('');
    }
  }

  function closeAssignment() {
    setActiveAssignment(null);
    setSessionItemIds([]);
    setActiveIndex(0);
    setShowBack(false);
    setAnswerRevealed(false);
    setChoiceFeedback(null);
    setAdvancing(false);
    clearSavedSession();
  }

  function flipCard() {
    if (reviewing || advancing) return;
    setShowBack((value) => {
      if (!value) setAnswerRevealed(true);
      return !value;
    });
  }

  async function review(action: ReviewAction) {
    if (!activeAssignment || !activeItem || !answerRevealed || reviewing || advancing) return;
    setReviewing(true);
    setError('');
    try {
      const response = await studentApi.reviewVocabularyItem(activeAssignment.id, activeItem.id, { action }, userEmail);
      const nextProgress = response.data as Progress;
      const wasMastered = activeItem.progress?.status === 'MASTERED';
      const isNowMastered = nextProgress.status === 'MASTERED';
      const nextAllItems = allItems.map((item) => item.id === activeItem.id ? { ...item, progress: nextProgress } : item);
      const nextSession = scheduleAfterReview(sessionItemIds, activeIndex, activeItem.id, action, isNowMastered);

      setActiveAssignment({ ...activeAssignment, items: nextAllItems });
      setSessionReviewed((value) => value + 1);
      if (action === 'HARD') {
        setSessionWrong((value) => value + 1);
        setSessionWeakIds((ids) => ids.includes(activeItem.id) ? ids : [...ids, activeItem.id]);
        setSessionXp((value) => value + 2);
      } else {
        setSessionCorrect((value) => value + 1);
        setSessionXp((value) => value + (action === 'MASTERED' ? 15 : action === 'EASY' ? 10 : 6));
      }
      if (!wasMastered && isNowMastered) setSessionMastered((value) => value + 1);
      setAdvancing(true);
      await wait(220);
      setSessionItemIds(nextSession.ids);
      setActiveIndex(nextSession.index);
      setShowBack(false);
      setAnswerRevealed(false);
      setChoiceFeedback(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong cap nhat duoc tien do tu vung');
    } finally {
      setAdvancing(false);
      setReviewing(false);
    }
  }

  async function chooseMeaning(option: string) {
    if (!activeAssignment || !activeItem || choiceFeedback || reviewing || advancing) return;
    const correct = option === answerText(activeItem);
    setChoiceFeedback({ selected: option, correct });
    setReviewing(true);
    setError('');
    try {
      const response = await studentApi.reviewVocabularyItem(activeAssignment.id, activeItem.id, { action: correct ? 'MC_CORRECT' : 'MC_WRONG' }, userEmail);
      const nextProgress = response.data as Progress;
      const nextAllItems = allItems.map((item) => item.id === activeItem.id ? { ...item, progress: nextProgress } : item);
      setActiveAssignment({ ...activeAssignment, items: nextAllItems });
      setSessionReviewed((value) => value + 1);
      if (correct) {
        setSessionCorrect((value) => value + 1);
        setSessionXp((value) => value + 6);
      } else {
        setSessionWrong((value) => value + 1);
        setSessionWeakIds((ids) => ids.includes(activeItem.id) ? ids : [...ids, activeItem.id]);
        setSessionXp((value) => value + 1);
      }
    } catch (err) {
      setChoiceFeedback(null);
      setError(err instanceof Error ? err.message : 'Khong cap nhat duoc tien do trac nghiem');
    } finally {
      setReviewing(false);
    }
  }

  async function continueChoice(action: ReviewAction) {
    if (!activeAssignment || !activeItem || !choiceFeedback || reviewing || advancing) return;
    setReviewing(true);
    setError('');
    try {
      let nextItems = allItems;
      let isNowMastered = activeItem.progress?.status === 'MASTERED';
      if (action === 'MASTERED') {
        const response = await studentApi.reviewVocabularyItem(activeAssignment.id, activeItem.id, { action: 'MASTERED' }, userEmail);
        const nextProgress = response.data as Progress;
        isNowMastered = nextProgress.status === 'MASTERED';
        nextItems = allItems.map((item) => item.id === activeItem.id ? { ...item, progress: nextProgress } : item);
        setActiveAssignment({ ...activeAssignment, items: nextItems });
        setSessionXp((value) => value + 9);
        if (activeItem.progress?.status !== 'MASTERED' && isNowMastered) setSessionMastered((value) => value + 1);
      }

      const nextSession = scheduleAfterReview(sessionItemIds, activeIndex, activeItem.id, action, action === 'MASTERED' || isNowMastered);
      setAdvancing(true);
      await wait(220);
      setSessionItemIds(nextSession.ids);
      setActiveIndex(nextSession.index);
      setChoiceFeedback(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong chuyen duoc cau hoi tiep theo');
    } finally {
      setAdvancing(false);
      setReviewing(false);
    }
  }

  useEffect(() => {
    if (!activeAssignment || !activeItem) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === 'Space') {
        if (sessionMode !== 'choice') {
          event.preventDefault();
          flipCard();
        }
        return;
      }
      if (!answerRevealed || reviewing || advancing) return;
      if (event.key === '1') review('HARD');
      if (event.key === '2') review('MEDIUM');
      if (event.key === '3') review('EASY');
      if (event.key === '4') review('MASTERED');
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAssignment, activeItem, answerRevealed, reviewing, advancing, showBack, activeIndex, sessionItemIds, sessionMode]);
  if (activeAssignment) {
    return (
      <main>
        <AppHeader role="student" />
        <section className="container vocabulary-study-container">
          <div className="study-topbar">
            <div>
              <div className="eyebrow">{sessionMode === 'choice' ? 'Multiple Choice' : 'Flashcard'}</div>
              <h1>{activeAssignment.title}</h1>
              <p>{activeAssignment.setTitle}</p>
              <div className="study-header-stats">
                <span>{learnedPercent}% progress</span>
                <span>{activeItem ? activeIndex + 1 : 0}/{sessionItems.length || totalCount} cards</span>
                <span><Flame size={15} /> {streak} streak</span>
                <span><Award size={15} /> {xp + sessionXp} XP</span>
              </div>
            </div>
            <button className="btn" onClick={closeAssignment} type="button">Quay lai danh sach</button>
          </div>

          {error ? <div className="error" style={{ marginBottom: 14 }}>{error}</div> : null}

          <div className="study-progress-strip">
            <div className="study-progress-copy">
              <strong>{learnedPercent}%</strong>
              <span>{sessionMode === 'choice' ? 'Trac nghiem' : sessionMode === 'new' ? 'Tu moi' : 'On lai'} - {remainingNewCount} chua mastered</span>
            </div>
            <div className="progress-track" aria-label={`Tien do ${learnedPercent}%`}>
              <span style={{ width: `${learnedPercent}%` }} />
            </div>
            <div className="study-reward-row" aria-label="Study rewards">
              <span><Flame size={16} /> {streak} streak</span>
              <span><Award size={16} /> {xp + sessionXp} XP</span>
              <span><CheckCircle2 size={16} /> {badgeLabel}</span>
            </div>
          </div>

          {activeItem ? (
            <section className="study-focus-shell">
              <div className="study-progress-dots" aria-label={`The ${activeIndex + 1} tren ${sessionItems.length}`}>
                <span>{activeIndex + 1}/{sessionItems.length}</span>
                {sessionItems.slice(0, 12).map((item, index) => (
                  <i className={index === activeIndex ? 'active' : isMastered(item) ? 'done' : ''} key={item.id} />
                ))}
              </div>

              {sessionMode === 'choice' ? (
                <div className={advancing ? 'choice-stage is-advancing' : 'choice-stage'} key={activeItem.id}>
                  <section className="card panel multiple-choice-card">
                    <div className="eyebrow">Multiple Choice</div>
                    <h2>{activeItem.word}</h2>
                    <p>Chon nghia tieng Viet dung.</p>
                    <div className="choice-options-grid" aria-label="Lua chon nghia tieng Viet">
                      {choiceOptions.map((option) => {
                        const isCorrectOption = option === answerText(activeItem);
                        const isSelected = choiceFeedback?.selected === option;
                        const stateClass = choiceFeedback
                          ? isCorrectOption
                            ? 'correct'
                            : isSelected
                              ? 'wrong'
                              : 'muted'
                          : '';
                        return (
                          <button
                            className={'choice-option ' + stateClass}
                            disabled={Boolean(choiceFeedback) || reviewing || advancing || choiceOptions.length < 4}
                            key={option}
                            onClick={() => chooseMeaning(option)}
                            type="button"
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {choiceOptions.length < 4 ? <p className="choice-feedback wrong">Can toi thieu 4 tu trong bo de tao cau hoi.</p> : null}
                    {choiceFeedback ? (
                      <>
                        <div className={choiceFeedback.correct ? 'choice-feedback correct' : 'choice-feedback wrong'}>
                          {choiceFeedback.correct ? 'Chinh xac' : 'Chua dung'} - dap an: {answerText(activeItem)}
                        </div>
                        <div className="choice-review-grid" aria-label="Chon cach hoc lai tu nay">
                          <button className="rating-card hard" disabled={reviewing || advancing} onClick={() => continueChoice('HARD')} type="button">
                            <Brain size={22} />
                            <span>Kho</span>
                          </button>
                          <button className="rating-card medium" disabled={reviewing || advancing} onClick={() => continueChoice('MEDIUM')} type="button">
                            <Gauge size={22} />
                            <span>Trung binh</span>
                          </button>
                          <button className="rating-card easy" disabled={reviewing || advancing} onClick={() => continueChoice('EASY')} type="button">
                            <Smile size={22} />
                            <span>De</span>
                          </button>
                          <button className="rating-card mastered" disabled={reviewing || advancing} onClick={() => continueChoice('MASTERED')} type="button">
                            <CheckCircle2 size={22} />
                            <span>Da thuoc</span>
                          </button>
                        </div>
                      </>
                    ) : null}
                  </section>
                </div>
              ) : (
              <div className={advancing ? 'flashcard-stage is-advancing' : 'flashcard-stage'} key={activeItem.id}>
                <section
                  aria-label={showBack ? 'Mat sau flashcard' : 'Mat truoc flashcard'}
                  className={showBack ? 'flashcard-card is-flipped' : 'flashcard-card'}
                  onClick={flipCard}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      flipCard();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flashcard-card-inner">
                    <div className="flashcard-face flashcard-front">
                      <span className="study-card-label">WORD</span>
                      <h2>{activeItem.word}</h2>
                      {activeItem.phonetic ? <p className="flashcard-phonetic">{activeItem.phonetic}</p> : <p className="flashcard-phonetic">IPA dang cap nhat</p>}
                      <button
                        className="audio-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          speakWord(activeItem.word);
                        }}
                        type="button"
                      >
                        <Volume2 size={20} /> Audio
                      </button>
                      <p className="flip-hint">Bam vao the de xem nghia</p>
                    </div>

                    <div className="flashcard-face flashcard-back">
                      <div className="flashcard-back-head">
                        <span className="study-card-label">MEANING</span>
                        <button
                          className="audio-button compact"
                          onClick={(event) => {
                            event.stopPropagation();
                            speakWord(activeItem.word);
                          }}
                          type="button"
                        >
                          <Volume2 size={18} /> Audio
                        </button>
                      </div>
                      <h2>{activeItem.meaningVi || 'Chua co nghia tieng Viet'}</h2>
                      {activeItem.partOfSpeech ? <span className="part-of-speech">{activeItem.partOfSpeech}</span> : null}
                      {activeItem.meaningEn ? <p className="meaning-en">{activeItem.meaningEn}</p> : null}
                      {activeItem.exampleSentence ? (
                        <div className="study-detail-box">
                          <strong>Example</strong>
                          <p>{activeItem.exampleSentence}</p>
                          {activeItem.exampleMeaningVi ? <small>{activeItem.exampleMeaningVi}</small> : null}
                        </div>
                      ) : null}
                      <div className="study-detail-box muted-box">
                        <strong>Collocation</strong>
                        <p>{activeItem.tags?.length ? activeItem.tags.join(' - ') : 'Chua co collocation'}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {answerRevealed ? (
                  <>
                    <div className="shortcut-hint">Space: lat the | 1: Kho | 2: Trung binh | 3: De | 4: Da thuoc</div>
                    <div className="study-rating-grid" aria-label="Danh gia muc do nho tu">
                      <button className="rating-card hard" disabled={reviewing || advancing} onClick={() => review('HARD')} type="button">
                        <Brain size={22} />
                        <span>Kho</span>
                      </button>
                      <button className="rating-card medium" disabled={reviewing || advancing} onClick={() => review('MEDIUM')} type="button">
                        <Gauge size={22} />
                        <span>Trung binh</span>
                      </button>
                      <button className="rating-card easy" disabled={reviewing || advancing} onClick={() => review('EASY')} type="button">
                        <Smile size={22} />
                        <span>De</span>
                      </button>
                      <button className="rating-card mastered" disabled={reviewing || advancing} onClick={() => review('MASTERED')} type="button">
                        <CheckCircle2 size={22} />
                        <span>Da thuoc</span>
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
              )}
            </section>
          ) : (
            <section className="card panel flashcard-complete study-session-complete">
              <div className="eyebrow">Session complete</div>
              <h2>{totalCount ? 'Hoan thanh phien hoc' : 'Bo tu nay chua co tu'}</h2>
              {totalCount ? (
                <div className="session-summary-grid">
                  <span><strong>{sessionReviewed}</strong> words reviewed</span>
                  <span><strong>{sessionMastered}</strong> mastered words</span>
                  <span><strong>{sessionWeakIds.length}</strong> weak words</span>
                  <span><strong>{sessionAccuracy}%</strong> accuracy</span>
                  <span><strong>{sessionXp}</strong> XP gained</span>
                </div>
              ) : <p>Giao vien can them tu vao bo tu vung truoc khi hoc sinh hoc flashcard.</p>}
              <div className="actions">
                {weakWords.length ? <button className="btn" onClick={() => {
                  setSessionMode('review');
                  setSessionItemIds(weakWords.map((item) => item.id));
                  setActiveIndex(0);
                  setShowBack(false);
                  setAnswerRevealed(false);
                  setChoiceFeedback(null);
                  setAdvancing(false);
                  resetSessionStats();
                }} type="button"><RotateCcw size={18} /> Review weak words</button> : null}
                {totalCount ? <button className="btn primary" onClick={() => openAssignment(activeAssignment.id, sessionMode)} type="button">Continue another session</button> : null}
                <button className="btn" onClick={closeAssignment} type="button">Back to vocabulary list</button>
              </div>
            </section>
          )}
        </section>
      </main>
    );
  }

  return (
    <main>
      <AppHeader role="student" />
      <section className="container">
        <div className="page-head">
          <div>
            <div className="eyebrow">Vocabulary</div>
            <h1>Tu vung cua toi</h1>
            <p>Xem cac bo tu vung duoc giao va mo Flashcard mode de hoc.</p>
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
              <div className="actions">
                <button className="btn primary" disabled={loadingAssignmentId === assignment.id} onClick={() => openAssignment(assignment.id, 'new')} type="button">
                  {loadingAssignmentId === assignment.id ? 'Dang mo...' : 'Hoc tu moi'}
                </button>
                <button className="btn" disabled={loadingAssignmentId === assignment.id} onClick={() => openAssignment(assignment.id, 'review')} type="button">
                  Hoc lai
                </button>
                <button className="btn" disabled={loadingAssignmentId === assignment.id} onClick={() => openAssignment(assignment.id, 'choice')} type="button">
                  Multiple choice
                </button>
              </div>
            </article>
          ))}
          {!loading && assignments.length === 0 ? (
            <section className="card panel">
              <div className="eyebrow">Phase 4</div>
              <h2>Chua co bo tu vung duoc giao</h2>
              <p>Khi giao vien giao bo tu cho lop hoac giao truc tiep, danh sach se hien tai day.</p>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
