import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Agent from './pages/Agent';
import Advisor from './pages/Advisor';
import Settings from './pages/Settings';
import Posts from './pages/Posts';
import useStore from './store';

function App() {
  const theme = useStore(state => state.theme);
  const setTheme = useStore(state => state.setTheme);

  // Apply theme class to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/advisor" element={<Advisor />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/agent/:id" element={<Agent />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
