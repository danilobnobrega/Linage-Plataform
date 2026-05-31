import { SignUp } from '@clerk/clerk-react';

function SignUpPage() {
  return (
    <div className="auth-page">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
}

export default SignUpPage;
