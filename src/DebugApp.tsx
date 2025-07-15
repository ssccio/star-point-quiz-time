import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { GameHeader } from "./components/game/GameHeader";
import { TEAMS } from "./utils/constants";

// Test individual components to isolate the issue
const ComponentTest = () => {
  const team = TEAMS.adah;
  
  return (
    <div className="p-4">
      <h2>Testing Game Components</h2>
      <GameHeader
        team={team}
        playerName="Test Player"
        currentQuestionIndex={0}
        totalQuestions={5}
        teamScore={100}
      />
    </div>
  );
};

const DebugApp = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: 'lightgreen' }}>
      <h1>Debug App - Component Test</h1>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/test" element={<ComponentTest />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default DebugApp;