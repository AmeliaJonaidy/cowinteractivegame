export default function MissionHUD() {
  return (
    <div className="fixed right-5 top-5 z-30 w-72 rounded-lg border border-white/15 bg-space-panel/90 p-3 shadow-2xl shadow-black/40 backdrop-blur">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-white/80">MISSION MAP</span>
        <span className="font-mono text-[10px] font-bold text-ignition drop-shadow">ACTIVE</span>
      </div>
      <div className="relative h-20">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 288 80" aria-hidden="true">
          <path
            d="M18 58 C70 8 116 18 146 44 S226 84 270 18"
            fill="none"
            stroke="rgb(79 209 197 / 0.22)"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M18 58 C70 8 116 18 146 44 S226 84 270 18"
            fill="none"
            stroke="rgb(79 209 197 / 0.9)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="8 9"
          />
        </svg>

        <MissionNode label="M1" className="left-0 top-12 text-white/70" />
        <MissionNode active label="M2" className="left-1/2 top-7 -translate-x-1/2 text-ignition" />
        <MissionNode label="M3" className="right-0 top-1 text-white/70" />
      </div>
    </div>
  );
}

function MissionNode({ label, active = false, className }) {
  return (
    <div className={`absolute flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`h-5 w-5 rounded-full border-2 ${
          active ? "border-ignition bg-ignition shadow-[0_0_28px_rgb(255_107_53_/0.7)]" : "border-telemetry/40 bg-space-panel"
        }`}
      />
      <span
        className={`rounded-full border bg-space-bg/80 px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.18em] backdrop-blur ${
          active ? "border-ignition/70" : "border-white/15"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
