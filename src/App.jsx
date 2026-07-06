import { useEffect, useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Leaderboard from "./components/Leaderboard";
import FacilitatorDashboard from "./components/FacilitatorDashboard";
import { initialSchools } from "./data/schools";
import { useRevealMachine } from "./hooks/useRevealMachine";

function App() {
  const [schools, setSchools] = useState(() => {
    try {
      const saved = window.localStorage.getItem("mission-2-schools");
      return saved ? JSON.parse(saved) : initialSchools;
    } catch {
      return initialSchools;
    }
  });
  const machine = useRevealMachine(schools);

  useEffect(() => {
    window.localStorage.setItem("mission-2-schools", JSON.stringify(schools));
  }, [schools]);

  return (
    <HashRouter>
      <div className="bg-space-bg min-h-screen">
        <Routes>
          <Route path="/" element={<Leaderboard schools={schools} machine={machine} />} />
          <Route
            path="/facilitator"
            element={<FacilitatorDashboard schools={schools} setSchools={setSchools} machine={machine} />}
          />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
