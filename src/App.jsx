import React, { useEffect, useLayoutEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useUserSync } from './hooks/useUserSync';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Advisor from './pages/Advisor';
import Settings from './pages/Settings';
import Posts from './pages/Posts';
import SignInPage from './pages/SignIn';
import SignUpPage from './pages/SignUp';
import CustomCursor from './components/CustomCursor';
import Credits from './pages/Credits';
import Checkout from './pages/Checkout';
import Help from './pages/Help';
import Terms from './pages/Terms';
import useStore from './store';
import { Menu, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

function MobileNavBar({ onHamburger }) {
  const { credits } = useStore();
  const navigate = useNavigate();

  const formatCredits = (n) => {
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
    return n.toString();
  };

  return (
    <div className="mobile-nav-bar">
      <button className="mobile-hamburger" onClick={onHamburger} aria-label="Abrir menu">
        <Menu size={22} />
      </button>
      <div className="mobile-logo" onClick={() => navigate('/home')}>
        <svg width="18" height="17" viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="white" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
        </svg>
        <span>LINAGE</span>
      </div>
      <div className="mobile-credits-pill">
        <Coins size={13} />
        <span>{formatCredits(credits)}</span>
      </div>
    </div>
  );
}

function AppContent() {
  useUserSync();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  useLayoutEffect(() => {
    setSidebarOpen(false);
    const main = document.querySelector('.main-content');
    if (main) main.scrollTop = 0;
  }, [pathname]);

  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname.startsWith('/checkout');

  return (
    <>
      {isAuthPage ? (
        <Routes>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
        </Routes>
      ) : (
        <>
          <CustomCursor />
          <ScrollToTop />
          <div className="app-layout">
            {sidebarOpen && (
              <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
            )}
            <MobileNavBar onHamburger={() => setSidebarOpen(true)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><Advisor /></ProtectedRoute>} />
                <Route path="/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/credits" element={<ProtectedRoute><Credits /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
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
