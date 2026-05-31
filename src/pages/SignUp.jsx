import { SignUp, ClerkLoaded } from '@clerk/clerk-react';
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
  return (
    <div className="auth-page">
      <ThreeBackground />
      <AuthCursor />
      <ClerkLoaded>
        <div className="auth-content">
          <div className="auth-logo">Linage</div>
          <SignUp
            fallbackRedirectUrl="/home"
            signInUrl="/sign-in"
            appearance={appearance}
          />
        </div>
      </ClerkLoaded>
    </div>
  );
}

export default SignUpPage;
