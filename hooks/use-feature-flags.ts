import { useAuth } from '@/lib/auth-context';
import { getFeatureFlags } from '@/lib/utils/feature-flags';

export function useFeatureFlags() {
  const { user } = useAuth();
  const fromUser = user?.username?.trim() || undefined;
  const fromStorage =
    typeof window !== 'undefined'
      ? localStorage.getItem('sparkd_username')?.trim() || undefined
      : undefined;
  /** Prefer the authenticated user — localStorage may be stale across logins. */
  const username = fromUser ?? fromStorage;
  const email = user?.email ?? null;
  return getFeatureFlags(email, username, user?.userId);
}
