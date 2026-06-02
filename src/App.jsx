import React, { useEffect, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useUserSync } from './hooks/useUserSync';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Agent from './pages/Agent';
import Advisor from './pages/Advisor';
import Settings from './pages/Settings';
import Posts from './pages/Posts';
import SignInPage from './pages/SignIn';
import SignUpPage from './pages/SignUp';
import CustomCursor from './components/CustomCursor';
import Credits from './pages/Credits';
import Help from './pages/Help';
import Terms from './pages/Terms';

function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    const main = document.querySelector('.main-content');
    if (main) main.scrollTop = 0;
  }, [pathname]);
  return null;
}

function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return children;
}

function RootRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  return <Navigate to={isSignedIn ? '/home' : '/sign-in'} replace />;
}

function AppContent() {
  useUserSync();

  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  const { pathname } = useLocation();
  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

  return (
    <>
      <ScrollToTop />
      {isAuthPage ? (
        <Routes>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
        </Routes>
      ) : (
        <>
          <CustomCursor />
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/agent/:id" element={<ProtectedRoute><Agent /></ProtectedRoute>} />
                <Route path="/advisor" element={<ProtectedRoute><Advisor /></ProtectedRoute>} />
                <Route path="/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/credits" element={<ProtectedRoute><Credits /></ProtectedRoute>} />
                <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
                <Route path="/terms" element={<ProtectedRoute><Terms /></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
