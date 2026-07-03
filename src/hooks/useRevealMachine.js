import { useReducer, useRef, useCallback, useEffect } from "react";
import { calcTotal, conversionRates } from "../data/conversionRates";
import { soundManager } from "../utils/sound";

export const PHASES = {
  READY: "ready",
  FLUCTUATING: "fluctuating",
  LOCKING: "locking",
  REVEALING: "revealing",
  REFOCUSING: "refocusing",
  FINALE: "finale",
  DONE: "done",
};

const FLUCTUATE_MS = 4000;
const LOCK_MS = 500;
const REVEAL_HOLD_MS = 3000;
const REFOCUS_MS = 500;
const FINALE_HOLD_MS = 6500;

function getRankings(schools) {
  return Object.entries(schools)
    .map(([id, data]) => ({ id, ...data, total: calcTotal(data, conversionRates) }))
    .sort((a, b) => b.total - a.total)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

function jitterAroundRankLine(value, scoreCeiling, activeCount) {
  const closenessToWinner = 1 - (activeCount - 1) / 4;
  const swing = Math.max(28, scoreCeiling * (0.5 - closenessToWinner * 0.18));
  const drift = (Math.random() - 0.5) * swing;
  const surge = Math.random() < 0.4 ? Math.random() * swing * 0.7 : 0;
  const floor = Math.max(4, value - swing * (0.55 - closenessToWinner * 0.25));
  const ceiling = Math.max(scoreCeiling, value + swing * 0.35);

  return Math.max(floor, Math.min(ceiling, value + drift + surge));
}

function sameScoreLine(ids, score) {
  return ids.reduce((next, id) => {
    next[id] = score;
    return next;
  }, {});
}

const initialState = {
  phase: PHASES.READY,
  revealedIds: [],
  currentRevealId: null,
  displayScores: {},
  showAllPolys: false,
};

function getSavedState() {
  try {
    const saved = window.localStorage.getItem("mission-2-reveal-state");
    if (!saved) return initialState;

    const parsed = JSON.parse(saved);
    const phase = [PHASES.READY, PHASES.FLUCTUATING, PHASES.DONE].includes(parsed.phase)
      ? parsed.phase
      : parsed.phase === PHASES.FINALE
      ? PHASES.DONE
      : PHASES.FLUCTUATING;

    return {
      ...initialState,
      ...parsed,
      phase,
      currentRevealId: phase === PHASES.FLUCTUATING ? null : parsed.currentRevealId,
    };
  } catch {
    return initialState;
  }
}

function rankLineScore(scoreCeiling, activeCount) {
  const totalSchools = 5;
  const revealIndex = totalSchools - activeCount;
  const progress = revealIndex / Math.max(1, totalSchools - 1);
  const visualPct = 0.22 + progress * 0.72;

  return scoreCeiling * visualPct;
}

function reducer(state, action) {
  switch (action.type) {
    case "TICK_JITTER":
      return { ...state, displayScores: action.payload };
    case "START_FLUCTUATE":
      return { ...state, phase: PHASES.FLUCTUATING, showAllPolys: false };
    case "START_LOCK":
      return {
        ...state,
        phase: PHASES.LOCKING,
        currentRevealId: action.payload.id,
        displayScores: action.payload.displayScores,
      };
    case "START_REVEAL":
      return { ...state, phase: PHASES.REVEALING };
    case "COMMIT_REVEAL": {
      const revealedIds = [...state.revealedIds, state.currentRevealId];
      return { ...state, revealedIds, phase: PHASES.REFOCUSING };
    }
    case "START_FINALE":
      return { ...state, phase: PHASES.FINALE, revealedIds: [...state.revealedIds, state.currentRevealId] };
    case "FINALE_DONE":
      return { ...state, phase: PHASES.DONE };
    case "SHOW_ALL_POLYS":
      return { ...state, showAllPolys: true };
    case "RESET_SEQUENCE":
      return initialState;
    case "REFOCUS_DONE":
      return { ...state, phase: PHASES.FLUCTUATING, currentRevealId: null };
    default:
      return state;
  }
}

export function useRevealMachine(schools) {
  const [state, dispatch] = useReducer(reducer, initialState, getSavedState);
  const jitterInterval = useRef(null);
  const rankings = getRankings(schools);

  const activeSorted = rankings
    .filter((s) => !state.revealedIds.includes(s.id))
    .sort((a, b) => a.total - b.total);
  const activeIds = activeSorted.map((s) => s.id);
  const scoreCeiling = Math.max(...rankings.map((s) => s.total), 80);

  const isWobbling = state.phase === PHASES.FLUCTUATING;

  useEffect(() => {
    window.localStorage.setItem("mission-2-reveal-state", JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!isWobbling) return;
    const target = activeSorted[0];
    if (!target) return;
    const targetLine = rankLineScore(scoreCeiling, activeIds.length);

    soundManager.startRoboticLoop();
    jitterInterval.current = setInterval(() => {
      const next = {};
      activeIds.forEach((id) => {
        next[id] = jitterAroundRankLine(targetLine, scoreCeiling, activeIds.length);
      });
      dispatch({ type: "TICK_JITTER", payload: next });
    }, 200);
    return () => {
      clearInterval(jitterInterval.current);
      soundManager.stopRoboticLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWobbling, activeIds.join(","), scoreCeiling, activeSorted[0]?.id]);

  const startSequence = useCallback(() => {
    if (state.phase !== PHASES.READY) return;
    soundManager.unlock();
    dispatch({ type: "START_FLUCTUATE" });
  }, [state.phase]);

  const showAllPolys = useCallback(() => {
    dispatch({ type: "SHOW_ALL_POLYS" });
  }, []);

  const resetSequence = useCallback(() => {
    soundManager.stopRoboticLoop();
    window.localStorage.removeItem("mission-2-reveal-state");
    dispatch({ type: "RESET_SEQUENCE" });
  }, []);

  useEffect(() => {
    if (state.phase !== PHASES.FLUCTUATING) return;

    const target = activeSorted[0];
    if (!target) return;
    const targetLine = rankLineScore(scoreCeiling, activeIds.length);
    let t2;
    let t3;
    let t4;
    let t5;

    const t1 = setTimeout(() => {
      clearInterval(jitterInterval.current);
      soundManager.stopRoboticLoop();
      dispatch({
        type: "START_LOCK",
        payload: {
          id: target.id,
          displayScores: sameScoreLine(activeIds, targetLine),
        },
      });

      t2 = setTimeout(() => {
        const isLast = activeSorted.length === 1;
        if (isLast) {
          dispatch({ type: "START_FINALE" });
          soundManager.playMoo();
          soundManager.playApplause();
          t3 = setTimeout(() => dispatch({ type: "FINALE_DONE" }), FINALE_HOLD_MS);
        } else {
          dispatch({ type: "START_REVEAL" });
          soundManager.playApplause();
          t4 = setTimeout(() => {
            dispatch({ type: "COMMIT_REVEAL" });
            t5 = setTimeout(() => dispatch({ type: "REFOCUS_DONE" }), REFOCUS_MS);
          }, REVEAL_HOLD_MS);
        }
      }, LOCK_MS);
    }, FLUCTUATE_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.revealedIds.length]);

  return {
    phase: state.phase,
    rankings,
    activeSorted,
    activeIds,
    revealedIds: state.revealedIds,
    currentRevealId: state.currentRevealId,
    displayScores: state.displayScores,
    startSequence,
    showAllPolys,
    resetSequence,
    showAllPolysSelected: state.showAllPolys,
    isDone: state.phase === PHASES.DONE,
    missionsComplete: state.revealedIds.length,
    totalMissions: rankings.length,
    PHASES,
  };
}
