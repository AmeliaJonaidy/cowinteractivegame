import { useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import MysteryBar from "./MysteryBar";
import SchoolBadge from "./SchoolBadge";
import MissionHUD from "./MissionHUD";

// Reorders a rank-ascending list so #1 sits in the middle slot and the rest
// fan out alternately left/right by rank (e.g. 4, 2, 1, 3, 5).
function podiumOrder(sortedByRank) {
  const n = sortedByRank.length;
  if (n === 0) return sortedByRank;
  const center = Math.floor((n - 1) / 2);
  const slots = new Array(n);
  let left = center - 1;
  let right = center + 1;
  slots[center] = sortedByRank[0];
  for (let i = 1; i < n; i++) {
    if (i % 2 === 1) {
      slots[left] = sortedByRank[i];
      left--;
    } else {
      slots[right] = sortedByRank[i];
      right++;
    }
  }
  return slots;
}

// Picks a "nice" min/max/step for the axis, zoomed into the actual score
// range instead of always starting at 0. e.g. scores 23-35 -> domain
// 20-35 in steps of 5; scores 80-200 -> domain 50-200 in steps of 50.
// Smaller real spreads get proportionally smaller nice steps, so bars
// swing dramatically instead of clustering near the top of a 0-100 axis.
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
  return { step, niceMin, niceMax };
}

export default function Leaderboard({ schools, machine }) {
  const {
    phase, rankings, activeSorted, revealedIds, currentRevealId,
    displayScores, startSequence, showAllPolys, resetSequence, showAllPolysSelected,
    isDone, missionsComplete, totalMissions, PHASES,
  } = machine;

  const visibleBars = showAllPolysSelected
    ? [...rankings].sort((a, b) => a.total - b.total)
    : activeSorted;
  const rawMinScore = Math.min(...rankings.map((s) => s.total));
  const rawMaxScore = Math.max(...rankings.map((s) => s.total), 80);
  const { step: tickStep, niceMin: axisMin, niceMax: axisMax } = niceDomain(rawMinScore, rawMaxScore, 5);
  const readyScore = axisMin + (axisMax - axisMin) * 0.42;
  const yTicks = useMemo(() => {
    const ticks = [];
    for (let v = axisMax; v >= axisMin; v -= tickStep) ticks.push(v);
    return ticks;
  }, [axisMin, axisMax, tickStep]);
  const revealedSorted = rankings
    .filter((s) => revealedIds.includes(s.id))
    .sort((a, b) => a.rank - b.rank);
  const winner = rankings[0];
  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 220 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 1.8}s`,
        duration: `${2.2 + Math.random() * 2.2}s`,
        rotate: `${Math.random() * 360}deg`,
        drift: `${(Math.random() - 0.5) * 110}px`,
        scale: 0.75 + Math.random() * 0.95,
      })),
    []
  );

  return (
    <div className="mission-two-space relative flex min-h-screen w-screen flex-col overflow-x-hidden overflow-y-auto pb-10">
      {phase === PHASES.FINALE && <Confetti pieces={confettiPieces} />}
      <MissionHUD current={missionsComplete} total={totalMissions} />

      <div className="relative z-10 shrink-0 px-6 pt-14 pb-5 text-center">
        <p className="font-mono text-xs font-bold text-telemetry tracking-[0.25em] drop-shadow">MISSION 2</p>
        <h1 className="font-display font-bold text-3xl tracking-wide text-white drop-shadow-lg">🚀 SPACE COW LEADERBOARD</h1>
        <p className="font-mono text-sm font-bold text-white/85 mt-1 drop-shadow">
          {phase === PHASES.READY && "STANDING BY FOR LAUNCH"}
          {phase === PHASES.FLUCTUATING && "TELEMETRY LIVE..."}
          {phase === PHASES.LOCKING && "LOCKING COORDINATES..."}
          {phase === PHASES.REVEALING && "REVEAL IN PROGRESS..."}
          {phase === PHASES.REFOCUSING && "REFOCUSING..."}
          {phase === PHASES.FINALE && "🐄 WINNER CONFIRMED 🐄"}
          {isDone && "MISSION COMPLETE"}
        </p>
        {phase === PHASES.READY && (
          <button
            onClick={startSequence}
            className="mt-4 rounded-lg bg-ignition px-6 py-3 font-display font-bold tracking-wide text-space-bg shadow-lg shadow-ignition/20"
          >
            Reveal Mission 2 Results
          </button>
        )}
        {phase !== PHASES.READY && (
          <button
            onClick={resetSequence}
            className="mt-4 rounded-lg border border-white/20 bg-space-panel/85 px-5 py-2.5 font-display font-bold tracking-wide text-white shadow-lg shadow-black/30 backdrop-blur"
          >
            Replay Leaderboard
          </button>
        )}
      </div>

      <div className="relative z-10 flex min-h-[42rem] flex-1 items-center justify-center px-8 pb-8">
        <div className="leaderboard-stage relative flex h-[36rem] w-full max-w-5xl items-end justify-evenly overflow-visible px-[4.5rem] pb-8 pt-8">
          <YAxis ticks={yTicks} />
          <AnimatePresence>
            {visibleBars.map((s) => (
              <MysteryBar
                key={s.id}
                id={s.id}
                school={schools[s.id]}
                displayScore={
                  showAllPolysSelected
                    ? s.total
                    : phase === PHASES.READY
                    ? readyScore
                    : displayScores[s.id] ?? readyScore
                }
                minScore={axisMin}
                maxScore={axisMax}
                isLocking={phase === PHASES.LOCKING && currentRevealId === s.id}
                isRevealing={
                  (phase === PHASES.REVEALING || phase === PHASES.FINALE) && currentRevealId === s.id
                }
                showStats={showAllPolysSelected}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {phase === PHASES.FINALE &&
        winner &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="flex flex-col items-center gap-2 rounded-lg border border-ignition/40 bg-space-panel/80 px-8 py-4 text-center shadow-2xl shadow-ignition/20"
            >
              <span className="font-mono text-xs text-text-dim">WINNER CONFIRMED</span>
              <div className="flex items-center gap-3">
                <SchoolBadge id={winner.id} logo={schools[winner.id].logo} size={48} />
                <div className="text-left">
                  <p className="font-display text-xl font-bold text-ignition">{winner.name}</p>
                  <p className="font-mono text-sm text-text-dim">{winner.total} Cows</p>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

      {isDone && !showAllPolysSelected && (
        <div className="relative z-10 flex justify-center gap-3 pb-8">
          <button
            onClick={showAllPolys}
            className="rounded-lg bg-telemetry px-6 py-3 font-display font-bold tracking-wide text-space-bg shadow-lg shadow-telemetry/20"
          >
            Show All Polys
          </button>
          <button
            onClick={resetSequence}
            className="rounded-lg border border-white/20 bg-space-panel/85 px-6 py-3 font-display font-bold tracking-wide text-white shadow-lg shadow-black/30"
          >
            Replay Leaderboard
          </button>
        </div>
      )}

      {/* Confirmed standings — winner centered podium-style, totals legible against the dark bg */}
      {revealedSorted.length > 0 && !showAllPolysSelected && (
        <div className="relative z-10 shrink-0 px-12 pb-8">
          <div className="flex items-end justify-center gap-8">
            {podiumOrder(revealedSorted).map((s) => {
              const isWinner = s.rank === 1;
              return (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: isWinner ? -12 : 0 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={
                      isWinner
                        ? "font-display font-bold text-ignition text-base drop-shadow"
                        : "font-display font-bold text-ignition text-sm"
                    }
                  >
                    #{s.rank}
                  </span>
                  <SchoolBadge id={s.id} logo={schools[s.id].logo} size={isWinner ? 52 : 40} />
                  <span
                    className={
                      isWinner
                        ? "font-mono text-sm font-bold text-white drop-shadow"
                        : "font-mono text-xs font-semibold text-white/80 drop-shadow"
                    }
                  >
                    {s.total} Cows
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function YAxis({ ticks }) {
  return (
    <div className="pointer-events-none absolute bottom-8 left-5 top-8 z-0 flex w-14 flex-col justify-between border-r border-telemetry/35 pr-3">
      {ticks.map((tick) => (
        <div key={tick} className="relative flex items-center justify-end">
          <span className="font-mono text-[11px] font-bold text-white/85 drop-shadow">{tick}</span>
          <span className="absolute -right-[17px] h-px w-3 bg-telemetry/55" />
        </div>
      ))}
    </div>
  );
}

function Confetti({ pieces }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece"
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            rotate: piece.rotate,
            "--confetti-drift": piece.drift,
            "--confetti-scale": piece.scale,
          }}
        />
      ))}
    </div>
  );
}
