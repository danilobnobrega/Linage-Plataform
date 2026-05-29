import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';

const UNLOCKED_AGENTS = ['dexter'];

function AgentGuard({ children }) {
  const { id } = useParams();
  if (!UNLOCKED_AGENTS.includes(id)) return <Navigate to="/home" replace />;
  return children;
}
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Agent from './pages/Agent';
import Advisor from './pages/Advisor';
import Settings from './pages/Settings';
import Posts from './pages/Posts';
import CustomCursor from './components/CustomCursor';

function App() {
  // Dark theme is permanent — set once on mount
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  return (
    <Router>
      <CustomCursor />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/advisor" element={<Advisor />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/agent/:id" element={<AgentGuard><Agent /></AgentGuard>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
