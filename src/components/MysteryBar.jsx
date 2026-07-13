import { motion } from "framer-motion";
import SchoolBadge from "./SchoolBadge";
import Tooltip from "./Tooltip";
import { useState } from "react";

export default function MysteryBar({
  id,
  school,
  displayScore,
  minScore = 0,
  maxScore,
  isLocking,
  isRevealing,
  showStats = false,
}) {
  const [hovered, setHovered] = useState(false);
  const span = Math.max(1, maxScore - minScore);
  const heightPct = Math.max(4, Math.min(100, ((displayScore - minScore) / span) * 100));

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 140, damping: 20 }}
      className="relative flex flex-col items-center justify-end"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      tabIndex={showStats ? 0 : -1}
    >
      {(isRevealing || showStats) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex min-h-20 flex-col items-center justify-end gap-1 text-center"
        >
          <SchoolBadge id={id} logo={school.logo} size={52} />
          <span className="max-w-28 font-display text-xs font-bold text-ignition leading-tight">{school.name}</span>
        </motion.div>
      )}

      <div className="relative flex h-[26rem] w-20 items-end overflow-visible">
        {isRevealing && (
          <motion.span
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute left-1/2 z-10 -translate-x-1/2 font-mono text-3xl font-bold text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.75)]"
            style={{ bottom: `calc(${heightPct}% + 0.45rem)` }}
          >
            {Math.round(displayScore)}
          </motion.span>
        )}
        <motion.div
          className={`w-full ${
            isRevealing || showStats
              ? "bg-ignition"
              : isLocking
              ? "bg-ignition scanline-overlay lock-flash"
              : "bg-telemetry/60"
          }`}
          animate={{ height: `${heightPct}%` }}
          transition={
            isLocking
              ? { duration: 0.15, ease: "easeInOut" }
              : isRevealing
              ? { type: "spring", stiffness: 280, damping: 20, mass: 0.7 }
              : { duration: 0.35, ease: "easeInOut" }
          }
        />
      </div>
      {showStats && (
        <span className="mt-2 font-mono text-xs font-bold text-text-primary">{Math.round(displayScore)} Cows</span>
      )}
      <Tooltip school={school} visible={showStats && hovered} />
    </motion.div>
  );
}
