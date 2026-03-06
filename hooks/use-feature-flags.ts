import { useAuth } from '@/lib/auth-context';
import { getFeatureFlags } from '@/lib/utils/feature-flags';

export function useFeatureFlags() {
  const { user } = useAuth();
  return getFeatureFlags(user?.email, user?.nombres);
}
