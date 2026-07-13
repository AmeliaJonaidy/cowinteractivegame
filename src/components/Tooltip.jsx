export default function Tooltip({ school, visible }) {
  if (!visible) return null;
  return (
    <div className="absolute z-50 top-24 left-1/2 w-60 -translate-x-1/2 rounded-lg border border-telemetry/40 bg-space-panel-light/95 p-3 font-mono text-xs shadow-2xl shadow-black/50 backdrop-blur">
      <div className="mb-2 border-b border-white/10 pb-1.5 font-display text-sm font-bold leading-tight text-ignition">
        {school.name}
      </div>
      <div className="grid gap-1.5">
        <StatRow icon="🐄" label="Normal Cows" value={school.normalCows} tone="bg-telemetry/15 text-telemetry" />
        <StatRow icon="🥩" label="Wagyu Cows" value={school.wagyuCows} tone="bg-ignition/15 text-ignition" />
        <StatRow icon="🔥" label="Fuel" value={school.parts} tone="bg-white/10 text-text-primary" />
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, tone }) {
  return (
    <div className="flex items-center rounded-md border border-white/10 bg-space-bg/60 px-2 py-1.5">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded text-base ${tone}`}>
          {icon}
        </span>
        <span className="font-mono text-xs font-bold text-text-dim">{label}</span>
      </div>
      <span className="ml-3 font-mono text-xs font-bold text-text-primary">{value}</span>
    </div>
  );
}
