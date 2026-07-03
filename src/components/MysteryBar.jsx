import { motion } from "framer-motion";
import SchoolBadge from "./SchoolBadge";
import Tooltip from "./Tooltip";
import { useState } from "react";

export default function MysteryBar({
  id,
  school,
  displayScore,
  maxScore,
  isLocking,
  isRevealing,
  showStats = false,
}) {
  const [hovered, setHovered] = useState(false);
  const heightPct = Math.max(4, Math.min(100, (displayScore / maxScore) * 100));

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
          <SchoolBadge id={id} logo={school.logo} size={44} />
          <span className="max-w-28 font-display text-xs font-bold text-ignition leading-tight">{school.name}</span>
        </motion.div>
      )}

      <div className="relative h-[26rem] w-20 flex items-end overflow-hidden rounded-t-md border border-white/10 bg-white/5 shadow-[0_0_28px_rgb(79_209_197_/0.08)]">
        <motion.div
          className={`w-full ${
            isRevealing || showStats
              ? "bg-ignition"
              : isLocking
              ? "bg-ignition scanline-overlay lock-flash"
              : "bg-telemetry/60"
          }`}
          animate={{ height: `${heightPct}%` }}
          transition={{ duration: isLocking ? 0.15 : 0.35, ease: "easeInOut" }}
        />
      </div>
      {showStats && (
        <span className="mt-2 font-mono text-xs font-bold text-text-primary">{Math.round(displayScore)} pts</span>
      )}
      <Tooltip school={school} visible={showStats && hovered} />
    </motion.div>
  );
}
