import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { authService } from '@/services/authService';
import type { AuthSession, Role, User } from '@/types/models';

type ProtectedState = {
  loading: boolean;
  session: AuthSession | null;
  user: User | null;
  refresh: () => Promise<void>;
};

export function useProtectedRoute(role: Role): ProtectedState {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await authService.requireRole(role);

    if (!result) {
      setSession(null);
      setUser(null);
      setLoading(false);
      router.replace(authService.getLoginRoute(role) as never);
      return;
    }

    setSession(result.session);
    setUser(result.user);
    setLoading(false);
  }, [role, router]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const run = async () => {
        setLoading(true);
        const result = await authService.requireRole(role);

        if (!active) {
          return;
        }

        if (!result) {
          setSession(null);
          setUser(null);
          setLoading(false);
          router.replace(authService.getLoginRoute(role) as never);
          return;
        }

        setSession(result.session);
        setUser(result.user);
        setLoading(false);
      };

      run();

      return () => {
        active = false;
      };
    }, [role, router])
  );

  return { loading, session, user, refresh };
}
