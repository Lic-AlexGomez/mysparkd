/**
 * Sistema de Feature Flags para funcionalidades sin backend
 * Solo el usuario TEST1 puede ver las nuevas features
 */

export interface FeatureFlags {
  multipleReactions: boolean;
  shareWithQR: boolean;
  polls: boolean;
  personalizedFeed: boolean;
  profileEdit: boolean;
  groupPosts: boolean;
  groupRoles: boolean;
  hashtagsAndMentions: boolean;
  advancedSearch: boolean;
  searchPage: boolean;
  storiesPage: boolean;
  analyticsPage: boolean;
  groupsPage: boolean;
  dashboard: boolean;
  managerPanel: boolean;
  trelloPage: boolean;
  tonightPage: boolean;
  mutualPlansPage: boolean;
}

const TEST_USER_EMAILS = ['test1@test.com', 'test1@gmail.com', 'test1@example.com'];
const TEST_USERNAMES   = ['test1', 'TEST1', 'test', 'TEST'];
const MANAGER_USERNAMES = ['manager1', 'MANAGER1', 'manager'];
const MANAGER_EMAILS    = ['manager1@test.com', 'manager@sparkd.com'];

const TEST_USER_IDS   = ['81a56d83-d576-4f74-b0fd-895c75a2b3b7']; // test1 userId

const TEST1_STRICT_USERNAMES = ['test1'];
const TEST1_STRICT_EMAILS    = ['test1@test.com', 'test1@gmail.com', 'test1@example.com'];

export function canUseNewFeatures(userEmail?: string | null, username?: string | null, userId?: string | null): boolean {
  if (userEmail && TEST_USER_EMAILS.some(e => e.toLowerCase() === userEmail.toLowerCase())) return true;
  if (username  && TEST_USERNAMES.some(u => u.toLowerCase() === username.toLowerCase())) return true;
  if (userId    && TEST_USER_IDS.includes(userId)) return true;
  return false;
}

/** Strict check: ONLY user "test1" (by username, mapped email or known userId). */
export function isStrictlyTest1(
  userEmail?: string | null,
  username?: string | null,
  userId?: string | null,
): boolean {
  const u = (username || '').trim().toLowerCase()
  if (u && TEST1_STRICT_USERNAMES.includes(u)) return true
  const e = (userEmail || '').trim().toLowerCase()
  if (e && TEST1_STRICT_EMAILS.includes(e)) return true
  if (userId && TEST_USER_IDS.includes(userId)) return true
  return false
}

export function isManager(userEmail?: string | null, username?: string | null, userId?: string | null): boolean {
  if (userEmail && MANAGER_EMAILS.some(e => e.toLowerCase() === userEmail.toLowerCase())) return true;
  if (username  && MANAGER_USERNAMES.some(u => u.toLowerCase() === username.toLowerCase())) return true;
  return false;
}

export function getFeatureFlags(userEmail?: string | null, username?: string | null, userId?: string | null): FeatureFlags {
  const isAdmin   = canUseNewFeatures(userEmail, username, userId);
  const isMgr     = isManager(userEmail, username, userId);
  const isTest1Strict = isStrictlyTest1(userEmail, username, userId);
  return {
    multipleReactions: true,
    shareWithQR: true,
    polls: true,
    personalizedFeed: true,
    profileEdit: true,
    groupPosts: true,
    groupRoles: true,
    hashtagsAndMentions: true,
    advancedSearch: true,
    searchPage: true,
    storiesPage: true,
    analyticsPage: true,
    groupsPage: true,           // ✅ Habilitado para todos
    dashboard:    isAdmin,          // 🔒 Solo admin (test1)
    managerPanel: isMgr || isAdmin, // 🔒 Manager + admin
    trelloPage: isTest1Strict,      // 🔒 Solo login con test1
    tonightPage: isTest1Strict,     // 🔒 Solo test1 (estricto)
    mutualPlansPage: isTest1Strict, // 🔒 Solo test1 (estricto)
  };
}
