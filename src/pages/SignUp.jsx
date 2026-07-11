import { SignUp, ClerkLoaded, useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import ThreeBackground from '../components/ThreeBackground';
import AuthCursor from '../components/AuthCursor';

const appearance = {
  variables: {
    colorBackground: 'rgba(8, 11, 18, 0.75)',
    colorInputBackground: 'rgba(255, 255, 255, 0.04)',
    colorInputText: '#e8e6f0',
    colorText: '#e8e6f0',
    colorTextSecondary: '#8b8897',
    colorPrimary: '#00ff88',
    colorDanger: '#ff4d6a',
    borderRadius: '12px',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    fontSize: '15px',
  },
  elements: {
    card: {
      background: 'rgba(8, 11, 18, 0.75)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 0 60px rgba(0, 255, 136, 0.05)',
    },
    headerTitle: {
      color: '#f0eef8',
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 500,
    },
    headerSubtitle: {
      color: '#8b8897',
    },
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
      color: '#030508',
      fontWeight: 600,
      '&:hover': { opacity: 0.9 },
    },
    formFieldInput: {
      background: 'rgba(255, 255, 255, 0.04)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      color: '#e8e6f0',
      '&:focus': { borderColor: '#00ff88', boxShadow: '0 0 0 2px rgba(0, 255, 136, 0.15)' },
    },
    footerActionLink: { color: '#00ff88' },
    identityPreviewText: { color: '#e8e6f0' },
    dividerLine: { background: 'rgba(255,255,255,0.08)' },
    dividerText: { color: '#8b8897' },
    socialButtonsBlockButton: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      color: '#e8e6f0',
    },
  },
};

function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const redirectUrl = new URLSearchParams(window.location.search).get('redirect_url') || '/welcome';

  if (!isLoaded) return null;
  if (isSignedIn) return <Navigate to={redirectUrl} replace />;
  const signInUrl = redirectUrl !== '/home'
    ? `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`
    : '/sign-in';

  return (
    <div className="auth-page">
      <ThreeBackground />
      <AuthCursor />
      <ClerkLoaded>
        <div className="auth-content">
          <div className="auth-logo">
            <svg width="28" height="27" viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
            </svg>
            Linage
          </div>
          <SignUp
            forceRedirectUrl={redirectUrl}
            signInUrl={signInUrl}
            appearance={appearance}
          />
          <p style={{ marginTop: '16px', fontSize: '13px', color: '#8b8897', textAlign: 'center', lineHeight: 1.6 }}>
            Ao continuar, você concorda com os{' '}
            <a href="/legal/uso" target="_blank" rel="noopener noreferrer" style={{ color: '#00ff88', textDecoration: 'none' }}>Termos de Uso</a>
            {' '}e a{' '}
            <a href="/legal/privacidade" target="_blank" rel="noopener noreferrer" style={{ color: '#00ff88', textDecoration: 'none' }}>Política de Privacidade</a>.
          </p>
        </div>
      </ClerkLoaded>
    </div>
  );
}

export default SignUpPage;
