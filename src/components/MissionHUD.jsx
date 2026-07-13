import { Rocket } from "lucide-react";

export default function MissionHUD() {
  return (
    <div className="fixed right-5 top-5 z-30 w-[22rem] overflow-hidden rounded-xl border border-white/15 bg-space-panel/90 shadow-2xl shadow-black/40 backdrop-blur">
      {/* Ambient backdrop: soft grid + planet glow, clipped to the card */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="absolute -bottom-10 -right-8 h-32 w-32 rounded-full bg-telemetry/10 blur-md" />
        <div className="absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-ignition/5 blur-xl" />
      </div>

      <div className="relative p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-white/80">MISSION MAP</span>
          <span className="font-mono text-[10px] font-bold text-ignition drop-shadow">ACTIVE</span>
        </div>

        <div className="relative h-28 px-1">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 352 112" aria-hidden="true">
            <path
              d="M18 84 C38 36 62 34 86 54 C112 78 138 90 162 64 C184 40 194 20 218 34 C244 50 244 76 268 68 C292 60 294 24 318 18"
              fill="none"
              stroke="rgb(79 209 197 / 0.18)"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M18 84 C38 36 62 34 86 54 C112 78 138 90 162 64 C184 40 194 20 218 34 C244 50 244 76 268 68 C292 60 294 24 318 18"
              fill="none"
              stroke="rgb(79 209 197 / 0.9)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="8 9"
            />
            <path
              d="M318 18 C330 14 338 14 346 10"
              fill="none"
              stroke="rgb(255 255 255 / 0.22)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="6 8"
            />
          </svg>

          <MissionNode label="M1" style={{ left: "2%", top: "60%" }} className="text-white/70" />
          <MissionNode active label="M2" style={{ left: "44%", top: "42%" }} className="-translate-x-1/2 text-ignition" />
          <MissionNode label="M3" style={{ left: "91%", top: "9%" }} className="-translate-x-1/2 text-white/70" />

          <span className="absolute right-8 top-1 -rotate-[35deg] font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/55">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
}

function MissionNode({ label, active = false, className, style }) {
  return (
    <div className={`absolute flex flex-col items-center gap-2 ${className}`} style={style}>
      {active ? (
        <div className="relative flex h-8 w-8 items-center justify-center">
          {/* pulsing glow behind the rocket */}
          <span className="absolute h-8 w-8 animate-ping rounded-full bg-ignition/30" />
          <span className="absolute h-5 w-5 rounded-full bg-ignition/70 shadow-[0_0_28px_rgb(255_107_53_/0.7)]" />
          <Rocket
            size={16}
            strokeWidth={2.5}
            className="relative z-10 -rotate-45 text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]"
            fill="currentColor"
          />
        </div>
      ) : (
        <div className="h-5 w-5 rounded-full border-2 border-telemetry/40 bg-space-panel" />
      )}
      <span
        className={`whitespace-nowrap rounded-full border bg-space-bg/80 px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.18em] backdrop-blur ${
          active ? "border-ignition/70" : "border-white/15"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
