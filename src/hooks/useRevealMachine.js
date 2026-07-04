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

// Picks a "nice" min/max for the visual domain, zoomed into the actual
// score range instead of always starting at 0 — mirrors the axis domain
// used in Leaderboard.jsx so the pre-reveal wobble stays in sync with
// what the chart will actually show.
function niceDomain(minValue, maxValue, tickCount = 5) {
  const safeMin = Math.min(minValue, maxValue);
  const safeMax = Math.max(minValue, maxValue, safeMin + 1);
  const rawStep = (safeMax - safeMin) / tickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;

  let niceResidual;
  if (residual > 5) niceResidual = 10;
  else if (residual > 2) niceResidual = 5;
  else if (residual > 1) niceResidual = 2;
  else niceResidual = 1;

  const step = niceResidual * magnitude;
  const niceMin = Math.max(0, Math.floor(safeMin / step) * step);
  const niceMax = Math.ceil(safeMax / step) * step;
  return { niceMin, niceMax };
}

// Single 200ms hop for a bar's displayed score. Steps from the previous
// value instead of picking a fresh random number, so bars glide instead
// of teleporting, while still not hinting at the real underlying score.
// Uses big hops across the FULL [axisMin, axisMax] domain (not a tight
// band around the target line), so it genuinely rockets up toward the
// top of the axis and back down — real drama, not a small wobble.
function jitterStep(prevValue, targetLine, axisMin, axisMax) {
  const domainSpan = Math.max(1, axisMax - axisMin);
  const maxStep = domainSpan * 0.24; // big enough to cross most of the axis in a couple of ticks

  const step = (Math.random() - 0.5) * 2 * maxStep;
  let next = prevValue + step;

  // light pull back toward the rank line so it trends the right direction
  // over time, weak enough that it still visits the extremes of the axis
  next += (targetLine - next) * 0.03;

  return Math.max(axisMin, Math.min(axisMax, next));
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

function rankLineScore(axisMin, axisMax, activeCount) {
  const totalSchools = 5;
  const revealIndex = totalSchools - activeCount;
  const progress = revealIndex / Math.max(1, totalSchools - 1);
  const visualPct = 0.22 + progress * 0.72;

  return axisMin + (axisMax - axisMin) * visualPct;
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
  const latestScoresRef = useRef({});
  const rankings = getRankings(schools);

  const activeSorted = rankings
    .filter((s) => !state.revealedIds.includes(s.id))
    .sort((a, b) => a.total - b.total);
  const activeIds = activeSorted.map((s) => s.id);
  const rawMinScore = Math.min(...rankings.map((s) => s.total));
  const rawMaxScore = Math.max(...rankings.map((s) => s.total), 80);
  const { niceMin: axisMin, niceMax: axisMax } = niceDomain(rawMinScore, rawMaxScore, 5);

  const isWobbling = state.phase === PHASES.FLUCTUATING;

  useEffect(() => {
    window.localStorage.setItem("mission-2-reveal-state", JSON.stringify(state));
  }, [state]);

  // Drives the per-tick jitter animation while a phase is fluctuating.
  useEffect(() => {
    if (!isWobbling) return;
    const target = activeSorted[0];
    if (!target) return;
    const targetLine = rankLineScore(axisMin, axisMax, activeIds.length);

    // seed so the very first tick steps from somewhere sensible, not from nothing
    activeIds.forEach((id) => {
      if (latestScoresRef.current[id] == null) {
        latestScoresRef.current[id] = targetLine;
      }
    });

    soundManager.startRoboticLoop();
    jitterInterval.current = setInterval(() => {
      const next = {};
      activeIds.forEach((id) => {
        const prev = latestScoresRef.current[id] ?? targetLine;
        const value = jitterStep(prev, targetLine, axisMin, axisMax);
        latestScoresRef.current[id] = value;
        next[id] = value;
      });
      dispatch({ type: "TICK_JITTER", payload: next });
    }, 200);

    return () => {
      clearInterval(jitterInterval.current);
      soundManager.stopRoboticLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWobbling, activeIds.join(","), axisMin, axisMax, activeSorted[0]?.id]);

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
    latestScoresRef.current = {};
    dispatch({ type: "RESET_SEQUENCE" });
  }, []);

  // --- Phase timeline -----------------------------------------------------
  // Each phase owns exactly one timer, in its own effect, keyed only on the
  // phase it cares about. This matters: previously all of these lived in a
  // single effect keyed on state.phase, which meant that the moment a
  // dispatch changed the phase, React would tear down that effect instance
  // (running its cleanup) *before* the nested timeout for the next
  // transition had a chance to fire — clearing a timer that was supposed to
  // survive. That's what caused the "stuck in LOCKING COORDINATES" hang.
  // Splitting these out means each timer is only ever cleared by its own
  // phase's cleanup, never by a sibling transition.

  // FLUCTUATING -> LOCKING
  useEffect(() => {
    if (state.phase !== PHASES.FLUCTUATING) return;
    const target = activeSorted[0];
    if (!target) return;
    const targetLine = rankLineScore(axisMin, axisMax, activeIds.length);

    const t = setTimeout(() => {
      clearInterval(jitterInterval.current);
      soundManager.stopRoboticLoop();
      dispatch({
        type: "START_LOCK",
        payload: {
          id: target.id,
          displayScores: sameScoreLine(activeIds, targetLine),
        },
      });
    }, FLUCTUATE_MS);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, activeIds.join(","), axisMin, axisMax, activeSorted[0]?.id]);

  // LOCKING -> REVEALING or FINALE
  useEffect(() => {
    if (state.phase !== PHASES.LOCKING) return;
    const isLast = activeSorted.length === 1;

    const t = setTimeout(() => {
      if (isLast) {
        dispatch({ type: "START_FINALE" });
        soundManager.playMoo();
        soundManager.playApplause();
      } else {
        dispatch({ type: "START_REVEAL" });
        soundManager.playApplause();
      }
    }, LOCK_MS);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // REVEALING -> COMMIT_REVEAL
  useEffect(() => {
    if (state.phase !== PHASES.REVEALING) return;
    const t = setTimeout(() => dispatch({ type: "COMMIT_REVEAL" }), REVEAL_HOLD_MS);
    return () => clearTimeout(t);
  }, [state.phase]);

  // REFOCUSING -> REFOCUS_DONE (back to FLUCTUATING for the next school)
  useEffect(() => {
    if (state.phase !== PHASES.REFOCUSING) return;
    const t = setTimeout(() => dispatch({ type: "REFOCUS_DONE" }), REFOCUS_MS);
    return () => clearTimeout(t);
  }, [state.phase]);

  // FINALE -> FINALE_DONE
  useEffect(() => {
    if (state.phase !== PHASES.FINALE) return;
    const t = setTimeout(() => dispatch({ type: "FINALE_DONE" }), FINALE_HOLD_MS);
    return () => clearTimeout(t);
  }, [state.phase]);

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