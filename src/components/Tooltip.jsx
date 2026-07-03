export default function Tooltip({ school, visible }) {
  if (!visible) return null;
  return (
    <div className="absolute z-50 top-24 left-1/2 w-80 -translate-x-1/2 rounded-lg border border-telemetry/40 bg-space-panel-light/95 p-5 font-mono text-sm shadow-2xl shadow-black/50 backdrop-blur">
      <div className="mb-3 border-b border-white/10 pb-2 font-display text-base font-bold text-ignition">
        {school.name}
      </div>
      <div className="grid gap-2">
        <StatRow icon="🐄" label="Normal Cows" value={school.normalCows} tone="bg-telemetry/15 text-telemetry" />
        <StatRow icon="🥩" label="Wagyu Cows" value={school.wagyuCows} tone="bg-ignition/15 text-ignition" />
        <StatRow icon="⚙" label="Parts" value={school.parts} tone="bg-white/10 text-text-primary" />
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, tone }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-space-bg/60 px-3 py-2">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-md text-xl ${tone}`}>
          {icon}
        </span>
        <span className="text-text-dim">{label}</span>
      </div>
      <span className="font-display text-2xl font-bold text-text-primary">{value}</span>
    </div>
  );
}
