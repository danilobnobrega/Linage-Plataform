import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import useStore from '../store';

export function useUserSync() {
  const { isSignedIn, getToken } = useAuth();
  const { setDbUser } = useStore();

  useEffect(() => {
    if (!isSignedIn) return;

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
  }, [isSignedIn]);
}
