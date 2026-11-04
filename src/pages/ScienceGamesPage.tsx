import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FlaskConical,
  Zap,
  Dna,
  Globe,
  Trophy,
  RotateCcw,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Delete,
  Grid,
} from 'lucide-react';
import {
  GameGradeFilter,
  GameModeId,
  GameLifecycleState,
  MemoryCard,
  CrosswordRowItem,
  DetectivePuzzleItem,
  GameRunSummary,
  SCIENCE_PAIR_BANK,
  CROSSWORD_ROW_BANK,
  DETECTIVE_PUZZLE_BANK,
  buildMemoryDeck,
  evaluateMemoryTurn,
  evaluateCrosswordRow,
  calculateAnswerReward,
  buildGameRunSummary,
  filterByGradeWithFallback,
  seededShuffle,
} from '../utils/scienceGameEngine.ts';
import {
  getAdminGamePairsSync,
  getAdminCrosswordsSync,
  getAdminDetectivePuzzlesSync,
} from '../services/adminService.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { getInitialProgress, saveUserProgress } from '../lib/supabase.ts';

const BEST_SCORE_STORAGE_KEY = 'khtn_science_games_best_scores_v2';

interface BestScoreMap {
  'memory-match': number;
  'science-crossword': number;
  'formula-detective': number;
}

function loadBestScores(): BestScoreMap {
  try {
    const raw = localStorage.getItem(BEST_SCORE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        'memory-match': Number(parsed['memory-match']) || 0,
        'science-crossword': Number(parsed['science-crossword']) || 0,
        'formula-detective': Number(parsed['formula-detective']) || 0,
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    'memory-match': 0,
    'science-crossword': 0,
    'formula-detective': 0,
  };
}

function saveBestScore(mode: GameModeId, score: number): BestScoreMap {
  const current = loadBestScores();
  const updated: BestScoreMap = {
    ...current,
    [mode]: Math.max(current[mode] || 0, Math.round(score)),
  };
  try {
    localStorage.setItem(BEST_SCORE_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
  return updated;
}

const DOMAIN_META: Record<
  'hoa-hoc' | 'vat-li' | 'sinh-hoc',
  {
    label: string;
    colorClass: string;
    Icon: React.FC<{ className?: string }>;
  }
> = {
  'hoa-hoc': {
    label: 'Hóa học',
    colorClass: 'text-teal-400',
    Icon: FlaskConical,
  },
  'vat-li': {
    label: 'Vật lí',
    colorClass: 'text-sky-400',
    Icon: Zap,
  },
  'sinh-hoc': {
    label: 'Sinh học',
    colorClass: 'text-emerald-400',
    Icon: Dna,
  },
};

const GAME_MODES: {
  id: GameModeId;
  title: string;
  subtitle: string;
  description: string;
  mechanicsLabel: string;
}[] = [
  {
    id: 'memory-match',
    title: 'Ghép Thẻ Tri Thức KHTN',
    subtitle: 'Trí nhớ Công thức & Định luật',
    description:
      'Lật và ghép chính xác cặp Khái niệm / Công thức với Định luật hoặc Hiện tượng tương ứng trong chương trình KHTN 6, 7, 8, 9.',
    mechanicsLabel: '12 thẻ · Chuỗi Combo · Gợi ý thông minh',
  },
  {
    id: 'science-crossword',
    title: 'Giải Mã Ô Chữ KHTN',
    subtitle: 'Điền ô chữ ngang & Mở từ khóa dọc',
    description:
      'Giải từng hàng ngang kiến thức Vật lí, Hóa học, Sinh học, Trái Đất để tìm ra các chữ cái ghép thành Từ Khóa Khoa Học hàng dọc.',
    mechanicsLabel: '5 hàng ngang · Cột từ khóa dọc · Gợi ý chữ cái',
  },
  {
    id: 'formula-detective',
    title: 'Giải Mã Bí Ẩn Phòng Lab',
    subtitle: 'Ghép chữ cái tìm thuật ngữ khoa học',
    description:
      'Dựa vào dữ kiện thực nghiệm và gợi ý của Thầy Hoàng, lắp ghép các ký tự hóa học - vật lí để mở khóa thuật ngữ chính xác.',
    mechanicsLabel: '5 mật mã · Gợi ý 2 tầng · Rèn tư duy thuật ngữ',
  },
];

/**
 * Custom Inline SVG Vitality Flask Pip (3 readable states: Full, Cracked/Damaged, Empty)
 */
const VitalityFlaskPip: React.FC<{ state: 'full' | 'cracked' | 'empty'; index: number }> = ({
  state,
  index,
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 sm:w-6 sm:h-6 shrink-0"
      aria-label={`Năng lượng ống nghiệm ${index + 1}: ${
        state === 'full' ? 'Đầy' : state === 'cracked' ? 'Cảnh báo' : 'Cạn'
      }`}
    >
      <path
        d="M9 2h6v2h-1v4.3l4.6 7.7A3 3 0 0 1 16 20.5H8a3 3 0 0 1-2.6-4.5L10 8.3V4H9V2z"
        fill={state === 'empty' ? '#0f172a' : state === 'cracked' ? '#451a03' : '#042f2e'}
        stroke={state === 'empty' ? '#334155' : state === 'cracked' ? '#f59e0b' : '#2dd4bf'}
        strokeWidth="1.75"
      />
      {state !== 'empty' && (
        <path
          d="M7.1 15.2h9.8l1.3 2.2A1.5 1.5 0 0 1 16.9 19.7H7.1a1.5 1.5 0 0 1-1.3-2.3l1.3-2.2z"
          fill={state === 'cracked' ? '#f59e0b' : '#14b8a6'}
        />
      )}
      {state === 'cracked' && (
        <path d="M11 10l2 2.5-1.5 2 2 2.5" stroke="#fef3c7" strokeWidth="1.3" fill="none" />
      )}
      {state === 'full' && <circle cx="10" cy="17" r="1.2" fill="#99f6e4" />}
    </svg>
  );
};

export const ScienceGamesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Game shell state
  const [gameState, setGameState] = useState<GameLifecycleState>('title');
  const [selectedMode, setSelectedMode] = useState<GameModeId>('memory-match');
  const [selectedGrade, setSelectedGrade] = useState<GameGradeFilter>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [bestScores, setBestScores] = useState<BestScoreMap>(() => loadBestScores());

  // Live Gameplay HUD metrics
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [correctAttempts, setCorrectAttempts] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [hintsRemaining, setHintsRemaining] = useState<number>(2);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error' | 'hint';
    title: string;
    detail: string;
  } | null>(null);
  const [runSummary, setRunSummary] = useState<GameRunSummary | null>(null);

  // Mode 1: Memory Match state
  const [memoryDeck, setMemoryDeck] = useState<MemoryCard[]>([]);
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [hintedPairId, setHintedPairId] = useState<string | null>(null);
  const [isCheckingPair, setIsCheckingPair] = useState<boolean>(false);

  // Mode 2: Science Crossword (Giải Mã Ô Chữ KHTN) state
  const [crosswordRows, setCrosswordRows] = useState<CrosswordRowItem[]>([]);
  const [activeRowIndex, setActiveRowIndex] = useState<number>(0);
  const [solvedRowIds, setSolvedRowIds] = useState<string[]>([]);
  const [rowDraftInput, setRowDraftInput] = useState<string>('');
  const [rowUsedHint, setRowUsedHint] = useState<boolean>(false);

  // Mode 3: Formula Detective state
  const [detectiveQueue, setDetectiveQueue] = useState<DetectivePuzzleItem[]>([]);
  const [detectiveIndex, setDetectiveIndex] = useState<number>(0);
  const [pickedIndices, setPickedIndices] = useState<number[]>([]);
  const [detectiveHintVisible, setDetectiveHintVisible] = useState<boolean>(false);

  const seedCounterRef = useRef<number>(101);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sync lifecycle state to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = gameState;
    return () => {
      delete document.body.dataset.state;
    };
  }, [gameState]);

  // Procedural Web Audio synthesizer
  const playSynthTone = useCallback(
    (kind: 'flip' | 'match' | 'wrong' | 'victory' | 'defeat') => {
      if (!soundEnabled) return;
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (kind === 'flip') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(580, now + 0.07);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        } else if (kind === 'match') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.08);
          osc.frequency.setValueAtTime(783.99, now + 0.16);
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.start(now);
          osc.stop(now + 0.28);
        } else if (kind === 'wrong') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(210, now);
          osc.frequency.linearRampToValueAtTime(150, now + 0.18);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        } else if (kind === 'victory') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.1);
          osc.frequency.setValueAtTime(783.99, now + 0.2);
          osc.frequency.setValueAtTime(1046.5, now + 0.3);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
        } else {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.linearRampToValueAtTime(180, now + 0.3);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
          osc.start(now);
          osc.stop(now + 0.32);
        }
      } catch {
        // Ignore audio blocked errors in headless environments
      }
    },
    [soundEnabled]
  );

  // Finalize game run and persist XP / Best Score
  const finishRun = useCallback(
    (params: {
      victory: boolean;
      finalScore: number;
      finalCorrect: number;
      finalTotalAttempts: number;
      finalMaxStreak: number;
      completedCount: number;
      totalCount: number;
    }) => {
      const prevBest = bestScores[selectedMode] || 0;
      const summary = buildGameRunSummary({
        mode: selectedMode,
        victory: params.victory,
        score: params.finalScore,
        previousBest: prevBest,
        correctAttempts: params.finalCorrect,
        totalAttempts: params.finalTotalAttempts,
        timeSpentSeconds: Math.max(1, elapsedSeconds),
        maxStreak: params.finalMaxStreak,
        completedCount: params.completedCount,
        totalCount: params.totalCount,
      });

      const updatedBests = saveBestScore(selectedMode, summary.score);
      setBestScores(updatedBests);
      setRunSummary(summary);
      setGameState('gameover');
      playSynthTone(params.victory ? 'victory' : 'defeat');

      if (user) {
        try {
          const progress = getInitialProgress(user.id);
          if (progress) {
            const nextBadges = [...progress.badges];
            if (params.victory && !nextBadges.includes('badge_quiz_master')) {
              nextBadges.push('badge_quiz_master');
            }
            saveUserProgress({
              ...progress,
              studyTimeMinutes: (progress.studyTimeMinutes || 0) + 3,
              badges: nextBadges,
              lastActive: new Date().toISOString(),
            });
          }
        } catch {
          // ignore local progress error
        }
      }
    },
    [bestScores, selectedMode, elapsedSeconds, playSynthTone, user]
  );

  // Start or restart a game session
  const startGame = useCallback(
    (modeOverride?: GameModeId, gradeOverride?: GameGradeFilter) => {
      const targetMode = modeOverride ?? selectedMode;
      const targetGrade = gradeOverride ?? selectedGrade;
      const seed = seedCounterRef.current++;

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      setScore(0);
      setStreak(0);
      setMaxStreak(0);
      setLives(3);
      setElapsedSeconds(0);
      setCorrectAttempts(0);
      setTotalAttempts(0);
      setHintsRemaining(2);
      setFeedbackBanner(null);
      setRunSummary(null);

      if (targetMode === 'memory-match') {
        const deck = buildMemoryDeck(targetGrade, 6, seed, getAdminGamePairsSync());
        setMemoryDeck(deck);
        setFlippedUids([]);
        setHintedPairId(null);
        setIsCheckingPair(false);
      } else if (targetMode === 'science-crossword') {
        const filtered = filterByGradeWithFallback(getAdminCrosswordsSync(), targetGrade, 5).slice(0, 5);
        setCrosswordRows(filtered);
        setActiveRowIndex(0);
        setSolvedRowIds([]);
        setRowDraftInput('');
        setRowUsedHint(false);
      } else {
        const filtered = filterByGradeWithFallback(getAdminDetectivePuzzlesSync(), targetGrade, 5);
        setDetectiveQueue(seededShuffle(filtered, seed).slice(0, 5));
        setDetectiveIndex(0);
        setPickedIndices([]);
        setDetectiveHintVisible(false);
      }

      document.body.dataset.state = 'playing';
      setGameState('playing');
    },
    [selectedMode, selectedGrade]
  );

  // Support ?autostart=1 for immediate testing
  useEffect(() => {
    if (searchParams.get('autostart') === '1' && gameState === 'title') {
      startGame();
    }
  }, [searchParams, gameState, startGame]);

  // 1-second timer during active play
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [gameState]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (gameState === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startGame();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setGameState((prev) =>
          prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev
        );
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, startGame]);

  // --- Mode 1: Memory Card Click Handler ---
  const handleCardClick = (card: MemoryCard) => {
    if (gameState !== 'playing' || isCheckingPair || card.isMatched || card.isFlipped) {
      return;
    }

    playSynthTone('flip');
    setHintedPairId(null);

    const nextDeck = memoryDeck.map((c) => (c.uid === card.uid ? { ...c, isFlipped: true } : c));
    const nextFlipped = [...flippedUids, card.uid];
    setMemoryDeck(nextDeck);
    setFlippedUids(nextFlipped);

    if (nextFlipped.length === 2) {
      setIsCheckingPair(true);
      const firstCard = nextDeck.find((c) => c.uid === nextFlipped[0])!;
      const secondCard = nextDeck.find((c) => c.uid === nextFlipped[1])!;
      const outcome = evaluateMemoryTurn(firstCard, secondCard, streak);
      const nextTotalAttempts = totalAttempts + 1;
      setTotalAttempts(nextTotalAttempts);

      if (outcome.isMatch) {
        playSynthTone('match');
        const nextScore = score + outcome.pointsDelta;
        const nextCorrect = correctAttempts + 1;
        const nextMaxStreak = Math.max(maxStreak, outcome.nextStreak);
        const pairInfo = SCIENCE_PAIR_BANK.find((p) => p.id === firstCard.pairId);

        const matchedDeck = nextDeck.map((c) =>
          c.pairId === firstCard.pairId ? { ...c, isMatched: true, isFlipped: true } : c
        );

        setMemoryDeck(matchedDeck);
        setFlippedUids([]);
        setIsCheckingPair(false);
        setScore(nextScore);
        setStreak(outcome.nextStreak);
        setMaxStreak(nextMaxStreak);
        setCorrectAttempts(nextCorrect);
        setFeedbackBanner({
          type: 'success',
          title: `Chính xác! +${outcome.pointsDelta} điểm (Combo x${outcome.nextStreak})`,
          detail: pairInfo?.explanation || 'Hai thẻ kiến thức hoàn toàn khớp nhau.',
        });

        const matchedPairsCount = matchedDeck.filter((c) => c.isMatched).length / 2;
        const totalPairsCount = matchedDeck.length / 2;
        if (matchedPairsCount >= totalPairsCount) {
          window.setTimeout(() => {
            finishRun({
              victory: true,
              finalScore: nextScore,
              finalCorrect: nextCorrect,
              finalTotalAttempts: nextTotalAttempts,
              finalMaxStreak: nextMaxStreak,
              completedCount: totalPairsCount,
              totalCount: totalPairsCount,
            });
          }, 420);
        }
      } else {
        playSynthTone('wrong');
        setStreak(0);
        setFeedbackBanner({
          type: 'error',
          title: 'Chưa khớp cặp kiến thức!',
          detail: 'Hãy ghi nhớ vị trí 2 thẻ vừa lật để ghép đúng ở lượt tiếp theo.',
        });

        window.setTimeout(() => {
          setMemoryDeck((curr) =>
            curr.map((c) =>
              nextFlipped.includes(c.uid) && !c.isMatched ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedUids([]);
          setIsCheckingPair(false);
        }, 650);
      }
    }
  };

  // --- Mode 2: Science Crossword Submission Handler ---
  const handleCrosswordSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (gameState !== 'playing') return;
    const currentRow = crosswordRows[activeRowIndex];
    if (!currentRow || solvedRowIds.includes(currentRow.id)) return;
    if (!rowDraftInput.trim()) return;

    const result = evaluateCrosswordRow(currentRow, rowDraftInput, streak, rowUsedHint);
    const nextTotal = totalAttempts + 1;
    setTotalAttempts(nextTotal);

    if (result.isCorrect) {
      playSynthTone('match');
      const nextScore = score + result.pointsDelta;
      const nextCorrect = correctAttempts + 1;
      const nextMaxStreak = Math.max(maxStreak, result.nextStreak);
      const nextSolved = [...solvedRowIds, currentRow.id];

      setScore(nextScore);
      setStreak(result.nextStreak);
      setMaxStreak(nextMaxStreak);
      setCorrectAttempts(nextCorrect);
      setSolvedRowIds(nextSolved);
      setRowDraftInput('');
      setRowUsedHint(false);
      setFeedbackBanner({
        type: 'success',
        title: `Đã giải Hàng ngang #${activeRowIndex + 1}: ${currentRow.displayTerm} (+${result.pointsDelta} điểm)`,
        detail: currentRow.explanation,
      });

      if (nextSolved.length >= crosswordRows.length) {
        window.setTimeout(() => {
          finishRun({
            victory: true,
            finalScore: nextScore,
            finalCorrect: nextCorrect,
            finalTotalAttempts: nextTotal,
            finalMaxStreak: nextMaxStreak,
            completedCount: crosswordRows.length,
            totalCount: crosswordRows.length,
          });
        }, 450);
      } else {
        // Jump to next unsolved row
        const nextUnsolvedIdx = crosswordRows.findIndex(
          (r, idx) => idx !== activeRowIndex && !nextSolved.includes(r.id)
        );
        if (nextUnsolvedIdx !== -1) {
          setActiveRowIndex(nextUnsolvedIdx);
        }
      }
    } else {
      playSynthTone('wrong');
      const nextLives = Math.max(0, lives - 1);
      setLives(nextLives);
      setStreak(0);
      setFeedbackBanner({
        type: 'error',
        title: `Đáp án "${rowDraftInput.toUpperCase()}" chưa khớp với Hàng ngang #${activeRowIndex + 1}!`,
        detail: `Từ cần tìm gồm ${currentRow.answer.length} chữ cái. Em có thể nhấn nút "Gợi ý" để mở chữ cái đầu.`,
      });

      if (nextLives <= 0) {
        window.setTimeout(() => {
          finishRun({
            victory: false,
            finalScore: score,
            finalCorrect: correctAttempts,
            finalTotalAttempts: nextTotal,
            finalMaxStreak: maxStreak,
            completedCount: solvedRowIds.length,
            totalCount: crosswordRows.length,
          });
        }, 450);
      }
    }
  };

  // --- Mode 3: Formula Detective Tile Selection ---
  const handlePickLetterIndex = (poolIndex: number) => {
    if (gameState !== 'playing') return;
    const currentPuzzle = detectiveQueue[detectiveIndex];
    if (!currentPuzzle || pickedIndices.includes(poolIndex)) return;
    if (pickedIndices.length >= currentPuzzle.answer.length) return;

    playSynthTone('flip');
    const nextPicked = [...pickedIndices, poolIndex];
    setPickedIndices(nextPicked);

    if (nextPicked.length === currentPuzzle.answer.length) {
      const assembled = nextPicked.map((idx) => currentPuzzle.lettersPool[idx]).join('');
      const isCorrect = assembled === currentPuzzle.answer;
      const nextTotal = totalAttempts + 1;
      setTotalAttempts(nextTotal);

      if (isCorrect) {
        playSynthTone('match');
        const reward = calculateAnswerReward({
          isCorrect: true,
          currentStreak: streak,
          remainingSeconds: 20,
          usedHint: detectiveHintVisible,
        });
        const nextScore = score + reward.pointsDelta;
        const nextCorrect = correctAttempts + 1;
        const nextMaxStreak = Math.max(maxStreak, reward.nextStreak);

        setScore(nextScore);
        setStreak(reward.nextStreak);
        setMaxStreak(nextMaxStreak);
        setCorrectAttempts(nextCorrect);
        setFeedbackBanner({
          type: 'success',
          title: `Giải mã thành công: ${currentPuzzle.displayAnswer} (+${reward.pointsDelta} điểm)`,
          detail: currentPuzzle.explanation,
        });

        if (detectiveIndex + 1 >= detectiveQueue.length) {
          window.setTimeout(() => {
            finishRun({
              victory: true,
              finalScore: nextScore,
              finalCorrect: nextCorrect,
              finalTotalAttempts: nextTotal,
              finalMaxStreak: nextMaxStreak,
              completedCount: detectiveQueue.length,
              totalCount: detectiveQueue.length,
            });
          }, 480);
        } else {
          window.setTimeout(() => {
            setDetectiveIndex((prev) => prev + 1);
            setPickedIndices([]);
            setDetectiveHintVisible(false);
          }, 520);
        }
      } else {
        playSynthTone('wrong');
        const nextLives = Math.max(0, lives - 1);
        setLives(nextLives);
        setStreak(0);
        setFeedbackBanner({
          type: 'error',
          title: `Từ ghép "${assembled}" chưa chính xác!`,
          detail: 'Hệ thống đã hoàn tác các chữ cái. Em hãy xem gợi ý hoặc thử lại nhé!',
        });

        if (nextLives <= 0) {
          window.setTimeout(() => {
            finishRun({
              victory: false,
              finalScore: score,
              finalCorrect: correctAttempts,
              finalTotalAttempts: nextTotal,
              finalMaxStreak: maxStreak,
              completedCount: detectiveIndex,
              totalCount: detectiveQueue.length,
            });
          }, 480);
        } else {
          window.setTimeout(() => {
            setPickedIndices([]);
          }, 520);
        }
      }
    }
  };

  // --- Hint Trigger across all 3 modes ---
  const handleTriggerHint = () => {
    if (gameState !== 'playing' || hintsRemaining <= 0) return;

    if (selectedMode === 'memory-match') {
      const unmatched = memoryDeck.filter((c) => !c.isMatched);
      if (unmatched.length === 0) return;
      const targetPairId = unmatched[0].pairId;
      setHintedPairId(targetPairId);
      setHintsRemaining((prev) => prev - 1);
      setFeedbackBanner({
        type: 'hint',
        title: 'Gợi ý Phòng Lab đã kích hoạt!',
        detail: 'Hai thẻ có viền sáng vàng thuộc cùng một cặp kiến thức KHTN.',
      });
    } else if (selectedMode === 'science-crossword') {
      const currentRow = crosswordRows[activeRowIndex];
      if (!currentRow) return;
      setRowUsedHint(true);
      setHintsRemaining((prev) => prev - 1);
      const prefix = currentRow.answer.slice(0, 2);
      setRowDraftInput(prefix);
      setFeedbackBanner({
        type: 'hint',
        title: `Gợi ý Hàng ngang #${activeRowIndex + 1}: Bắt đầu bằng "${prefix}..." (${currentRow.answer.length} chữ cái)`,
        detail: currentRow.explanation,
      });
    } else {
      const currentPuzzle = detectiveQueue[detectiveIndex];
      if (!currentPuzzle) return;
      setDetectiveHintVisible(true);
      setHintsRemaining((prev) => prev - 1);
      setFeedbackBanner({
        type: 'hint',
        title: `Gợi ý chữ cái đầu: "${currentPuzzle.answer[0]}"`,
        detail: currentPuzzle.scientificHint,
      });
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const matchedPairsCount = memoryDeck.filter((c) => c.isMatched).length / 2;
  const totalPairsCount = memoryDeck.length / 2 || 6;

  // Compute maximum left offset for crossword alignment so the key column lines up vertically
  const maxKeyColOffset = Math.max(2, ...crosswordRows.map((r) => r.keyColumnIndex));

  return (
    <div className="min-h-[calc(100vh-4.5rem)] w-full max-w-full overflow-x-clip bg-[#071527] text-slate-100 flex flex-col justify-between relative">
      {/* Subtle laboratory coordinate grid backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, rgba(45, 212, 191, 0.35) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* ==================== 1. TITLE SCREEN STATE ==================== */}
      {gameState === 'title' && (
        <section className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 flex flex-col justify-between">
          {/* Top Breadcrumb & High Score Summary */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/90 pb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-teal-300 transition whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4 text-teal-400" />
              <span>Quay lại Trang chủ KHTN</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-300 font-mono tabular-nums">
              <span>
                Kỷ lục Ghép thẻ: <strong className="text-teal-300">{bestScores['memory-match']}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Ô chữ KHTN: <strong className="text-sky-300">{bestScores['science-crossword']}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Giải mã: <strong className="text-amber-300">{bestScores['formula-detective']}</strong>
              </span>
            </div>
          </div>

          {/* Center Title Lockup & Game Mode Selection */}
          <div className="my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Custom SVG Emblem & Primary CTA */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <div className="inline-flex items-center gap-3.5">
                <svg
                  viewBox="0 0 64 64"
                  className="w-16 h-16 shrink-0"
                  aria-label="Biểu tượng Đấu Trường Khoa Học KHTN"
                >
                  <rect
                    x="4"
                    y="4"
                    width="56"
                    height="56"
                    rx="16"
                    fill="#0d2847"
                    stroke="#14b8a6"
                    strokeWidth="2.5"
                  />
                  <ellipse
                    cx="32"
                    cy="32"
                    rx="22"
                    ry="9"
                    transform="rotate(-30 32 32)"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  <ellipse
                    cx="32"
                    cy="32"
                    rx="22"
                    ry="9"
                    transform="rotate(30 32 32)"
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="2"
                  />
                  <circle cx="32" cy="32" r="5.5" fill="#f59e0b" />
                  <circle cx="17" cy="24" r="2.5" fill="#38bdf8" />
                  <circle cx="47" cy="40" r="2.5" fill="#2dd4bf" />
                </svg>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-teal-400">
                    KHOA HỌC SỐ KHTN · Kết nối tri thức
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                    Trò Chơi KHTN
                  </h1>
                </div>
              </div>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Ôn luyện công thức Vật lí, danh pháp quốc tế Hóa học và quá trình Sinh học qua 3 chế độ chơi tương tác: Ghép thẻ trí nhớ, Giải mã Ô chữ KHTN và Thám tử Phòng Lab!
              </p>

              {/* Grade Filter Bar */}
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-slate-400">
                  Chọn khối lớp kiến thức:
                </span>
                <div
                  role="group"
                  aria-label="Lọc câu hỏi theo khối lớp"
                  className="inline-flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl"
                >
                  {(['all', 6, 7, 8, 9] as GameGradeFilter[]).map((g) => (
                    <button
                      key={String(g)}
                      type="button"
                      onClick={() => setSelectedGrade(g)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedGrade === g
                          ? 'bg-teal-500 text-slate-950 shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {g === 'all' ? 'Tất cả khối 6-9' : `Lớp ${g}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Start Handshake Button */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  data-start="true"
                  onClick={() => startGame()}
                  className="px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-lg transition flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Bắt đầu chơi ngay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSoundEnabled((prev) => !prev)}
                  aria-label={soundEnabled ? 'Tắt âm thanh trò chơi' : 'Bật âm thanh trò chơi'}
                  className="px-4 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4 text-teal-400" />
                      <span>Âm thanh: Bật</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-slate-400" />
                      <span>Âm thanh: Tắt</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: 3 Selectable Game Mode Cards */}
            <div className="lg:col-span-7 space-y-3.5">
              {GAME_MODES.map((mode, idx) => {
                const isSelected = selectedMode === mode.id;
                const modeBest = bestScores[mode.id] || 0;
                return (
                  <div
                    key={mode.id}
                    className={`rounded-2xl p-5 border transition-all ${
                      isSelected
                        ? 'bg-[#0E294B] border-teal-400 shadow-lg'
                        : 'bg-slate-900/75 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-teal-300 flex flex-wrap items-center gap-2">
                          <span>Chế độ 0{idx + 1}</span>
                          <span aria-hidden="true">·</span>
                          <span>{mode.subtitle}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">Kỷ lục: {modeBest} điểm</span>
                        </div>
                        <h2 className="text-lg font-extrabold text-white">{mode.title}</h2>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {mode.description}
                        </p>
                        <div className="pt-1 text-xs text-slate-400">{mode.mechanicsLabel}</div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedMode(mode.id)}
                          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            isSelected
                              ? 'bg-teal-500/20 text-teal-200 border border-teal-400/50'
                              : 'bg-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          {isSelected ? 'Đang chọn' : 'Chọn chế độ'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMode(mode.id);
                            startGame(mode.id, selectedGrade);
                          }}
                          className="px-3.5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition whitespace-nowrap cursor-pointer"
                        >
                          {mode.id === 'memory-match'
                            ? 'Chơi Ghép Thẻ'
                            : mode.id === 'science-crossword'
                            ? 'Chơi Ô Chữ'
                            : 'Chơi Giải Mã'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flat Borderless Control Hint Line in Bottom Safe Margin */}
          <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Enter Bắt đầu & Kiểm tra ô chữ · Click chọn Hàng ngang 1-5 · Esc Tạm dừng
          </div>
        </section>
      )}

      {/* ==================== 2. PLAYING HUD & ARENA ==================== */}
      {gameState !== 'title' && (
        <section className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col justify-between gap-5">
          {/* Unified Perimeter Top HUD Dock (Responsive & Overflow-Safe) */}
          <div className="bg-[#0B213D] border border-slate-700/90 rounded-2xl px-3.5 py-2.5 shadow-lg flex flex-wrap items-center justify-between gap-3">
            {/* Left Cluster: Mode Switcher & Vitality Flasks */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div
                role="tablist"
                aria-label="Chuyển đổi nhanh chế độ trò chơi"
                className="inline-flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl"
              >
                {[
                  { id: 'memory-match' as GameModeId, label: 'Ghép thẻ' },
                  { id: 'science-crossword' as GameModeId, label: 'Ô chữ KHTN' },
                  { id: 'formula-detective' as GameModeId, label: 'Giải mã' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selectedMode === tab.id}
                    onClick={() => {
                      setSelectedMode(tab.id);
                      startGame(tab.id, selectedGrade);
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedMode === tab.id
                        ? 'bg-teal-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Vitality Pips for modes with lives */}
              {selectedMode !== 'memory-match' && (
                <div className="flex items-center gap-1 pl-2.5 border-l border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">
                    HP
                  </span>
                  {[0, 1, 2].map((idx) => {
                    const pipState =
                      idx < lives ? (lives === 1 ? 'cracked' : 'full') : 'empty';
                    return <VitalityFlaskPip key={idx} index={idx} state={pipState} />;
                  })}
                </div>
              )}
            </div>

            {/* Center Cluster: Hero-to-Kicker Tabular Readouts */}
            <div className="flex items-center gap-4 sm:gap-6 font-mono tabular-nums">
              <div className="text-center">
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">
                  ĐIỂM SỐ
                </div>
                <div
                  data-testid="game-score"
                  className="text-lg sm:text-xl font-extrabold text-teal-300"
                >
                  {Math.round(score)}
                </div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">
                  COMBO
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-amber-300">
                  x{Math.round(streak)}
                </div>
              </div>

              <div className="text-center">
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">
                  TIẾN ĐỘ
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-white">
                  {selectedMode === 'memory-match'
                    ? `${matchedPairsCount}/${totalPairsCount}`
                    : selectedMode === 'science-crossword'
                    ? `${solvedRowIds.length}/${crosswordRows.length || 5}`
                    : `${detectiveIndex + 1}/${detectiveQueue.length || 5}`}
                </div>
              </div>

              <div className="hidden md:block text-center">
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">
                  THỜI GIAN
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-sky-300">
                  {formatTime(elapsedSeconds)}
                </div>
              </div>
            </div>

            {/* Right Cluster: Hint Button & Utility Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleTriggerHint}
                disabled={hintsRemaining <= 0}
                className={`px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                  hintsRemaining > 0
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/50 cursor-pointer'
                    : 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Gợi ý ({hintsRemaining})</span>
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                title="Bật/Tắt âm thanh"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setSoundEnabled((prev) => !prev);
                }}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 transition shrink-0"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-teal-400" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Tạm dừng trò chơi"
                title="Tạm dừng [Esc]"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
                }}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 transition shrink-0"
              >
                <Pause className="w-4 h-4 text-amber-300" />
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Chơi lại từ đầu"
                title="Chơi lại từ đầu"
                onClick={(e) => {
                  e.currentTarget.blur();
                  startGame();
                }}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 transition shrink-0"
              >
                <RotateCcw className="w-4 h-4 text-sky-300" />
              </button>
            </div>
          </div>

          {/* Live Scientific Feedback Callout Banner */}
          {feedbackBanner && (
            <div
              role="status"
              className={`rounded-xl px-4 py-3 border flex items-start gap-3 transition-all ${
                feedbackBanner.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-100'
                  : feedbackBanner.type === 'hint'
                  ? 'bg-amber-950/70 border-amber-500/50 text-amber-100'
                  : 'bg-rose-950/70 border-rose-500/50 text-rose-100'
              }`}
            >
              {feedbackBanner.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : feedbackBanner.type === 'hint' ? (
                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs sm:text-sm">
                <div className="font-bold">{feedbackBanner.title}</div>
                <div className="text-slate-200/90 mt-0.5">{feedbackBanner.detail}</div>
              </div>
            </div>
          )}

          {/* ==================== ACTIVE BOARD BY MODE ==================== */}
          <div className="my-auto">
            {/* MODE 1: MEMORY MATCH */}
            {selectedMode === 'memory-match' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {memoryDeck.map((card, idx) => {
                  const isRevealed = card.isFlipped || card.isMatched;
                  const isHinted = hintedPairId === card.pairId && !card.isMatched;
                  const domainMeta = DOMAIN_META[card.domain];

                  return (
                    <button
                      key={card.uid}
                      type="button"
                      onClick={() => handleCardClick(card)}
                      disabled={card.isMatched}
                      aria-label={
                        isRevealed
                          ? `Thẻ ${idx + 1}: ${card.content}`
                          : `Lật thẻ bí ẩn số ${idx + 1}`
                      }
                      className={`min-h-[116px] sm:min-h-[128px] p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        card.isMatched
                          ? 'bg-emerald-950/60 border-emerald-400/70 text-emerald-100'
                          : card.isFlipped
                          ? 'bg-[#102C52] border-teal-400 text-white shadow-lg'
                          : isHinted
                          ? 'bg-[#0E2545] border-amber-400 ring-2 ring-amber-400/50 text-slate-200'
                          : 'bg-[#0B1E38] hover:bg-[#10294B] border-slate-700/90 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className={isRevealed ? domainMeta.colorClass : 'text-slate-400'}>
                          {isRevealed ? `${domainMeta.label} · Lớp ${card.grade}` : `Thẻ KHTN #${idx + 1}`}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {card.isMatched
                            ? '✓ ĐÃ GHÉP'
                            : isRevealed
                            ? card.cardType === 'term'
                              ? 'KHÁI NIỆM'
                              : 'ĐỊNH NGHĨA'
                            : 'LẬT THẺ'}
                        </span>
                      </div>

                      {isRevealed ? (
                        <div className="text-xs sm:text-sm font-bold leading-snug text-white my-auto py-1">
                          {card.content}
                        </div>
                      ) : (
                        <div className="my-auto flex items-center justify-center py-2">
                          <FlaskConical className="w-7 h-7 text-teal-500/50" />
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400">
                        {card.isMatched ? 'Đã hoàn thành cặp' : isRevealed ? 'Đang mở' : 'Nhấn để mở thẻ'}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* MODE 2: SCIENCE CROSSWORD (GIẢI MÃ Ô CHỮ KHTN) */}
            {selectedMode === 'science-crossword' && crosswordRows.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Interactive Crossword Grid */}
                <div className="lg:col-span-7 bg-[#0B213D] border border-slate-700/90 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl overflow-x-auto">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4 text-teal-400" />
                      <h2 className="text-sm sm:text-base font-extrabold text-white">
                        Bảng Ô Chữ Khoa Học Tự Nhiên
                      </h2>
                    </div>
                    <span className="text-xs text-amber-300 font-semibold">
                      Cột vàng: Chữ cái Từ Khóa Dọc
                    </span>
                  </div>

                  <div className="space-y-2.5 min-w-[340px]">
                    {crosswordRows.map((row, rIdx) => {
                      const isSolved = solvedRowIds.includes(row.id);
                      const isSelected = activeRowIndex === rIdx;
                      const padLeftCells = Math.max(0, maxKeyColOffset - row.keyColumnIndex);
                      const letters = row.answer.split('');

                      return (
                        <div
                          key={row.id}
                          onClick={() => {
                            setActiveRowIndex(rIdx);
                            setRowDraftInput('');
                            setRowUsedHint(false);
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`Chọn Hàng ngang số ${rIdx + 1} (${row.answer.length} chữ cái)`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setActiveRowIndex(rIdx);
                              setRowDraftInput('');
                            }
                          }}
                          className={`p-2 rounded-xl border transition flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-[#12325B] border-teal-400 shadow-md'
                              : isSolved
                              ? 'bg-emerald-950/30 border-emerald-500/40'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg font-mono text-xs font-extrabold flex items-center justify-center shrink-0 ${
                              isSolved
                                ? 'bg-emerald-500 text-slate-950'
                                : isSelected
                                ? 'bg-teal-400 text-slate-950'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {rIdx + 1}
                          </span>

                          <div className="flex items-center gap-1.5 flex-nowrap">
                            {/* Leading alignment spacers so keyColumnIndex aligns vertically */}
                            {Array.from({ length: padLeftCells }).map((_, sIdx) => (
                              <div
                                key={`pad-${sIdx}`}
                                className="hidden sm:block w-8 h-9 sm:w-9 sm:h-10 shrink-0 opacity-0 pointer-events-none"
                              />
                            ))}

                            {letters.map((char, cIdx) => {
                              const isKeyCell = cIdx === row.keyColumnIndex;
                              const draftChar = isSelected
                                ? rowDraftInput.toUpperCase()[cIdx] || ''
                                : '';
                              const displayChar = isSolved ? char : draftChar;

                              return (
                                <div
                                  key={cIdx}
                                  className={`w-8 h-9 sm:w-9 sm:h-10 rounded-lg font-mono text-sm font-extrabold flex items-center justify-center border transition shrink-0 ${
                                    isSolved
                                      ? isKeyCell
                                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                                        : 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                                      : isKeyCell
                                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                                      : isSelected
                                      ? 'bg-slate-900 border-teal-400/70 text-white'
                                      : 'bg-slate-950/80 border-slate-700 text-slate-500'
                                  }`}
                                >
                                  {displayChar}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Active Row Clue & Answer Input Panel */}
                {crosswordRows[activeRowIndex] && (
                  <div className="lg:col-span-5 bg-[#0C2342] border border-slate-700 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
                    <div className="flex items-center justify-between text-xs font-semibold text-teal-300">
                      <span>
                        Hàng ngang #{activeRowIndex + 1} ·{' '}
                        {DOMAIN_META[crosswordRows[activeRowIndex].domain].label}
                      </span>
                      <span>
                        Lớp {crosswordRows[activeRowIndex].grade} (
                        {crosswordRows[activeRowIndex].answer.length} chữ cái)
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Câu hỏi gợi mở:
                      </div>
                      <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                        “{crosswordRows[activeRowIndex].clue}”
                      </p>
                    </div>

                    {solvedRowIds.includes(crosswordRows[activeRowIndex].id) ? (
                      <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 space-y-1.5">
                        <div className="text-xs font-bold text-emerald-300">
                          ✓ Đã giải thành công: {crosswordRows[activeRowIndex].displayTerm}
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {crosswordRows[activeRowIndex].explanation}
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleCrosswordSubmit} className="space-y-3">
                        <div>
                          <label
                            htmlFor="crossword-answer-input"
                            className="block text-xs font-semibold text-slate-300 mb-1.5"
                          >
                            Nhập đáp án Hàng ngang #{activeRowIndex + 1} (không dấu):
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              id="crossword-answer-input"
                              type="text"
                              maxLength={crosswordRows[activeRowIndex].answer.length + 3}
                              value={rowDraftInput}
                              onChange={(e) => setRowDraftInput(e.target.value)}
                              placeholder={`Nhập ${crosswordRows[activeRowIndex].answer.length} chữ cái...`}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-teal-400 focus:outline-none font-mono text-sm font-bold text-white uppercase tracking-wider"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm transition whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              Kiểm tra
                            </button>
                          </div>
                        </div>

                        {/* Quick row selector buttons */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                          <span>Chọn nhanh hàng ngang:</span>
                          <div className="flex items-center gap-1.5">
                            {crosswordRows.map((r, idx) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                  setActiveRowIndex(idx);
                                  setRowDraftInput('');
                                }}
                                className={`w-7 h-7 rounded-lg font-mono text-xs font-bold transition cursor-pointer ${
                                  activeRowIndex === idx
                                    ? 'bg-teal-500 text-slate-950'
                                    : solvedRowIds.includes(r.id)
                                    ? 'bg-emerald-600/40 text-emerald-200 border border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                {idx + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MODE 3: FORMULA DETECTIVE */}
            {selectedMode === 'formula-detective' && detectiveQueue[detectiveIndex] && (
              <div className="max-w-3xl mx-auto bg-[#0C2342] border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-teal-300">
                  <span>
                    Hồ sơ Khoa học #{detectiveIndex + 1} ·{' '}
                    {DOMAIN_META[detectiveQueue[detectiveIndex].domain].label}
                  </span>
                  <span>KHTN Lớp {detectiveQueue[detectiveIndex].grade}</span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Dữ kiện thực nghiệm:
                  </div>
                  <h2 className="text-base sm:text-xl font-bold text-white leading-relaxed">
                    “{detectiveQueue[detectiveIndex].clue}”
                  </h2>
                  {detectiveHintVisible && (
                    <div className="text-xs sm:text-sm text-amber-300 font-medium pt-1">
                      Gợi ý chuyên môn: {detectiveQueue[detectiveIndex].scientificHint}
                    </div>
                  )}
                </div>

                {/* Answer Slots */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Ô trả lời ({pickedIndices.length}/{detectiveQueue[detectiveIndex].answer.length}{' '}
                      ký tự):
                    </span>
                    {pickedIndices.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPickedIndices((prev) => prev.slice(0, -1))}
                        className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-semibold cursor-pointer"
                      >
                        <Delete className="w-3.5 h-3.5" />
                        <span>Xóa chữ cuối</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 py-3 px-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    {detectiveQueue[detectiveIndex].answer.split('').map((_, slotIdx) => {
                      const poolIndex = pickedIndices[slotIdx];
                      const char =
                        poolIndex !== undefined
                          ? detectiveQueue[detectiveIndex].lettersPool[poolIndex]
                          : '';
                      return (
                        <div
                          key={slotIdx}
                          className={`w-11 h-12 sm:w-12 sm:h-13 rounded-xl border font-mono text-lg font-extrabold flex items-center justify-center ${
                            char
                              ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                              : 'bg-slate-900 border-slate-700 text-slate-500'
                          }`}
                        >
                          {char || '_'}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selectable Letter Pool */}
                <div className="space-y-2">
                  <div className="text-xs text-slate-400">
                    Chọn các ký tự bên dưới để ghép thành thuật ngữ đúng:
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    {detectiveQueue[detectiveIndex].lettersPool.map((letter, idx) => {
                      const isUsed = pickedIndices.includes(idx);
                      return (
                        <button
                          key={`${letter}-${idx}`}
                          type="button"
                          disabled={isUsed}
                          onClick={() => handlePickLetterIndex(idx)}
                          aria-label={`Chọn chữ cái ${letter}`}
                          className={`w-12 h-12 rounded-xl font-mono text-base font-extrabold border transition cursor-pointer ${
                            isUsed
                              ? 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
                              : 'bg-slate-800 hover:bg-teal-500 hover:text-slate-950 border-slate-600 text-white shadow-sm'
                          }`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Safe Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
            <button
              type="button"
              onClick={() => setGameState('title')}
              className="hover:text-white transition font-semibold cursor-pointer"
            >
              ← Quay về Sảnh chọn chế độ chơi
            </button>
            <span>Nhấn [Esc] để tạm dừng</span>
          </div>
        </section>
      )}

      {/* ==================== 3. PAUSE MODAL CARD ==================== */}
      {gameState === 'paused' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4"
        >
          <div className="bg-[#0B213D] border border-slate-700 rounded-2xl max-w-md w-full p-6 sm:p-8 text-center space-y-6 shadow-2xl">
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Đang Tạm Dừng
              </div>
              <h2 id="pause-modal-title" className="text-2xl font-extrabold text-white">
                Tạm Dừng Phòng Thí Nghiệm
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono tabular-nums">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] font-sans text-slate-400">Điểm hiện tại</div>
                <div className="text-xl font-extrabold text-teal-300">{Math.round(score)}</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] font-sans text-slate-400">Thời gian</div>
                <div className="text-xl font-extrabold text-sky-300">{formatTime(elapsedSeconds)}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setGameState('playing')}
                className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm transition cursor-pointer"
              >
                Tiếp tục trò chơi
              </button>
              <button
                type="button"
                onClick={() => startGame()}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition cursor-pointer"
              >
                Chơi lại màn này
              </button>
              <button
                type="button"
                onClick={() => setGameState('title')}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition cursor-pointer"
              >
                Về Sảnh Trò Chơi KHTN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4. VICTORY / GAME OVER MODAL CARD ==================== */}
      {gameState === 'gameover' && runSummary && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gameover-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4"
        >
          <div className="bg-[#0B213D] border border-teal-500/40 rounded-2xl max-w-lg w-full p-6 sm:p-8 text-center space-y-6 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/40 mx-auto flex items-center justify-center">
              {runSummary.victory ? (
                <Trophy className="w-7 h-7 text-amber-400" />
              ) : (
                <Sparkles className="w-7 h-7 text-teal-400" />
              )}
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-widest text-teal-400">
                {runSummary.victory ? 'Hoàn Thành Xuất Sắc!' : 'Kết Thúc Lượt Thử Thách'}
              </div>
              <h2 id="gameover-modal-title" className="text-2xl sm:text-3xl font-extrabold text-white">
                {runSummary.victory ? 'Chinh Phục Đấu Trường KHTN' : 'Cố Gắng Lên Nhé!'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Đã hoàn thành {runSummary.completedCount}/{runSummary.totalCount} nhiệm vụ · Nhận{' '}
                <strong className="text-amber-300">+{runSummary.xpEarned} XP</strong> tích lũy
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono tabular-nums">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] font-sans text-slate-400">Điểm số / Kỷ lục</div>
                <div className="text-lg sm:text-xl font-extrabold text-teal-300">
                  {runSummary.score} / {runSummary.bestScore}
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] font-sans text-slate-400">Độ chính xác</div>
                <div className="text-lg sm:text-xl font-extrabold text-emerald-300">
                  {runSummary.accuracyPercent}%
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] font-sans text-slate-400">Thời gian</div>
                <div className="text-lg sm:text-xl font-extrabold text-sky-300">
                  {formatTime(runSummary.timeSpentSeconds)}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                data-start="true"
                onClick={() => startGame()}
                className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm transition cursor-pointer"
              >
                {runSummary.victory ? 'Chơi tiếp lượt mới' : 'Thử lại ngay'}
              </button>
              <button
                type="button"
                onClick={() => setGameState('title')}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition cursor-pointer"
              >
                Đổi chế độ chơi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
