import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import useStore from '../store';

export function useUserSync() {
  const { isSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { setDbUser } = useStore();

  useEffect(() => {
    if (!isSignedIn || !clerkUser) return;

    const fullName = clerkUser.fullName || clerkUser.username || '';
    if (fullName) {
      useStore.setState((s) => ({ user: { ...s.user, name: fullName } }));
    }

    async function sync() {
      try {
        const token = await getToken();
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const user = await res.json();
        setDbUser(user);
      } catch {}
    }

    sync();
  }, [isSignedIn, clerkUser]);
}
