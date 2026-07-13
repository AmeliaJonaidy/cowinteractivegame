// src/components/FacilitatorDashboard.jsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { calcTotal, conversionRates } from "../data/conversionRates";

export default function FacilitatorDashboard({ schools, setSchools, rates = conversionRates, setRates, machine }) {
  const schoolIds = Object.keys(schools);
  const [selectedId, setSelectedId] = useState(schoolIds[0]);
  const [form, setForm] = useState({ normalCows: "", wagyuCows: "", parts: "" });
  const [savedMsg, setSavedMsg] = useState("");
  const [confirmingReset, setConfirmingReset] = useState(false);

  const previewTotal = useMemo(() => {
    return calcTotal(
      {
        normalCows: Number(form.normalCows) || 0,
        wagyuCows: Number(form.wagyuCows) || 0,
        parts: Number(form.parts) || 0,
      },
      rates
    );
  }, [form, rates]);

  function handleSelectSchool(id) {
    setSelectedId(id);
    const s = schools[id];
    setForm({
      normalCows: s.normalCows || "",
      wagyuCows: s.wagyuCows || "",
      parts: s.parts || "",
    });
    setSavedMsg("");
  }

  function handleSave() {
    setSchools((prev) => ({
      ...prev,
      [selectedId]: {
        ...prev[selectedId],
        normalCows: Number(form.normalCows) || 0,
        wagyuCows: Number(form.wagyuCows) || 0,
        parts: Number(form.parts) || 0,
      },
    }));
    setSavedMsg(`Saved for ${selectedId} — total ${previewTotal} Cows`);
  }

  function handleRateChange(key, value) {
    setRates?.((prev) => ({
      ...prev,
      [key]: Number(value) || 0,
    }));
  }

  function handleResetScores() {
    setSchools((prev) => {
      const next = {};
      for (const id of Object.keys(prev)) {
        next[id] = { ...prev[id], normalCows: 0, wagyuCows: 0, parts: 0 };
      }
      return next;
    });
    setForm({ normalCows: "", wagyuCows: "", parts: "" });
    setSavedMsg("");
    setConfirmingReset(false);
  }

  const { phase, isDone, PHASES } = machine;
  const canStart = phase === PHASES.READY;

  return (
    <div className="min-h-screen px-6 py-10 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-xl">🎛️ Facilitator Dashboard</h1>
        <Link to="/" className="text-telemetry text-sm font-mono underline">
          View Leaderboard →
        </Link>
      </div>

      {/* Score entry panel */}
      <div className="rounded-2xl bg-space-panel/60 border border-white/5 p-5 mb-6">
        <label className="block text-xs font-mono text-text-dim mb-1">SELECT SCHOOL</label>
        <select
          value={selectedId}
          onChange={(e) => handleSelectSchool(e.target.value)}
          className="w-full mb-4 rounded-lg bg-space-panel-light border border-white/10 px-3 py-2 font-mono"
        >
          {schoolIds.map((id) => (
            <option key={id} value={id}>
              {id} — {schools[id].name}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-1 gap-3 mb-4">
          <Field
            label="Normal Cows"
            value={form.normalCows}
            onChange={(v) => setForm((f) => ({ ...f, normalCows: v }))}
          />
          <Field
            label="Wagyu Cows"
            value={form.wagyuCows}
            onChange={(v) => setForm((f) => ({ ...f, wagyuCows: v }))}
          />
          <Field
            label="Fuel"
            value={form.parts}
            onChange={(v) => setForm((f) => ({ ...f, parts: v }))}
          />
        </div>

        <div className="mb-4 rounded-lg border border-white/10 bg-space-bg/70 p-3">
          <h2 className="mb-3 font-display text-xs font-bold tracking-wide text-text-dim">CONVERSION VALUES</h2>
          <div className="grid grid-cols-3 gap-2">
            <Field
              label="Cow"
              value={rates.normalCow}
              onChange={(v) => handleRateChange("normalCow", v)}
            />
            <Field
              label="Fuel"
              value={rates.fuel}
              onChange={(v) => handleRateChange("fuel", v)}
            />
            <Field
              label="Wagyu Cow"
              value={rates.wagyuCow}
              onChange={(v) => handleRateChange("wagyuCow", v)}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 rounded-lg bg-space-bg px-3 py-2 border border-ignition/30">
          <span className="text-xs font-mono text-text-dim">CALCULATED TOTAL</span>
          <span className="font-mono text-lg text-ignition font-bold">{previewTotal} Cows</span>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-telemetry text-space-bg font-display font-bold tracking-wide"
        >
          Save Entry
        </button>

        {savedMsg && <p className="mt-2 text-xs font-mono text-telemetry">{savedMsg}</p>}
      </div>

      {/* Current entries at a glance */}
      <div className="rounded-2xl bg-space-panel/40 border border-white/5 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-xs text-text-dim tracking-wide">CURRENT ENTRIES</h2>
          {!confirmingReset ? (
            <button
              onClick={() => setConfirmingReset(true)}
              className="font-mono text-[11px] font-bold text-red-400/80 hover:text-red-400 underline"
            >
              Reset All Scores
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-text-dim">Sure?</span>
              <button
                onClick={handleResetScores}
                className="rounded-md bg-red-500/90 px-2 py-1 font-mono text-[11px] font-bold text-white"
              >
                Yes, reset
              </button>
              <button
                onClick={() => setConfirmingReset(false)}
                className="rounded-md border border-white/15 px-2 py-1 font-mono text-[11px] text-text-dim"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="space-y-1">
          {schoolIds.map((id) => (
            <div key={id} className="flex justify-between font-mono text-xs">
              <span className="text-text-dim">{id}</span>
              <span>{calcTotal(schools[id], rates)} Cows</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mission control */}
      <div className="rounded-2xl bg-space-panel/60 border border-white/5 p-5">
        <h2 className="font-display font-bold text-sm mb-3 text-text-dim tracking-wide">MISSION CONTROL</h2>
        <Link
          to="/"
          className={`block w-full rounded-xl py-3 text-center font-display font-bold tracking-wide ${
            canStart ? "bg-ignition text-space-bg" : "bg-white/10 text-text-dim"
          }`}
        >
          {isDone ? "View Completed Results" : canStart ? "Open Leaderboard to Reveal" : "View Running Sequence"}
        </Link>
        {!canStart && !isDone && (
          <p className="mt-2 text-xs font-mono text-text-dim">
            Runs automatically — 4s per reveal, 3s hold on each name.
          </p>
        )}
        {!canStart && (
          <p className="mt-2 text-xs font-mono text-text-dim">
            Make sure all scores are saved before starting — entries can't be edited mid-sequence.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-mono text-text-dim mb-1">{label.toUpperCase()}</label>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-space-panel-light border border-white/10 px-3 py-2 font-mono"
      />
    </div>
  );
}
