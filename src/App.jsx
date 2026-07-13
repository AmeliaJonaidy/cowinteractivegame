import { useEffect, useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Leaderboard from "./components/Leaderboard";
import FacilitatorDashboard from "./components/FacilitatorDashboard";
import { initialSchools } from "./data/schools";
import { conversionRates } from "./data/conversionRates";
import { useRevealMachine } from "./hooks/useRevealMachine";

function mergeSavedScores(savedSchools) {
  const merged = {};

  for (const [id, initialSchool] of Object.entries(initialSchools)) {
    const savedSchool = savedSchools?.[id] ?? {};
    merged[id] = {
      ...initialSchool,
      normalCows: Number(savedSchool.normalCows) || 0,
      wagyuCows: Number(savedSchool.wagyuCows) || 0,
      parts: Number(savedSchool.parts) || 0,
    };
  }

  return merged;
}

function App() {
  const [schools, setSchools] = useState(() => {
    try {
      const saved = window.localStorage.getItem("mission-2-schools");
      return saved ? mergeSavedScores(JSON.parse(saved)) : initialSchools;
    } catch {
      return initialSchools;
    }
  });
  const [rates, setRates] = useState(() => {
    try {
      const saved = window.localStorage.getItem("mission-2-conversion-rates");
      return saved ? { ...conversionRates, ...JSON.parse(saved) } : conversionRates;
    } catch {
      return conversionRates;
    }
  });
  const machine = useRevealMachine(schools, rates);

  useEffect(() => {
    window.localStorage.setItem("mission-2-schools", JSON.stringify(schools));
  }, [schools]);

  useEffect(() => {
    window.localStorage.setItem("mission-2-conversion-rates", JSON.stringify(rates));
  }, [rates]);

  return (
    <HashRouter>
      <div className="bg-space-bg min-h-screen">
        <Routes>
          <Route path="/" element={<Leaderboard schools={schools} machine={machine} />} />
          <Route
            path="/facilitator"
            element={
              <FacilitatorDashboard
                schools={schools}
                setSchools={setSchools}
                rates={rates}
                setRates={setRates}
                machine={machine}
              />
            }
          />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
