import { useAuth } from '@/lib/auth-context';
import { getFeatureFlags } from '@/lib/utils/feature-flags';

export function useFeatureFlags() {
  const { user } = useAuth();
  const username = typeof window !== 'undefined'
    ? localStorage.getItem('sparkd_username') ?? user?.username
    : user?.username;
  return getFeatureFlags(null, username);
}
