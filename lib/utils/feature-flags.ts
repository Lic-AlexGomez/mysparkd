/**
 * Sistema de Feature Flags para funcionalidades sin backend
 * Solo el usuario TEST1 puede ver las nuevas features
 */

export interface FeatureFlags {
  // Reacciones múltiples (5 tipos)
  multipleReactions: boolean;
  
  // Compartir con QR
  shareWithQR: boolean;
  
  // Encuestas/Polls
  polls: boolean;
  
  // Feed personalizado (Para ti / Siguiendo)
  personalizedFeed: boolean;
  
  // Edición de perfil (username, bio, location, website)
  profileEdit: boolean;
  
  // Posts en grupos
  groupPosts: boolean;
  
  // Roles en grupos (admin/moderator/member)
  groupRoles: boolean;
  
  // Hashtags y menciones
  hashtagsAndMentions: boolean;
  
  // Búsqueda avanzada
  advancedSearch: boolean;
  
  // Páginas completas
  searchPage: boolean;
  storiesPage: boolean;
  analyticsPage: boolean;
  groupsPage: boolean;
}

const TEST_USER_EMAIL = 'test1@test.com';
const TEST_USER_EMAILS = ['test1@test.com', 'test1@gmail.com', 'test1@example.com'];
const TEST_USERNAMES = ['test1', 'TEST1', 'test', 'TEST'];

/**
 * Determina si el usuario actual puede ver las nuevas features
 */
export function canUseNewFeatures(userEmail?: string | null, username?: string | null): boolean {
  if (userEmail) {
    const emailLower = userEmail.toLowerCase();
    if (TEST_USER_EMAILS.some(e => e.toLowerCase() === emailLower)) {
      return true;
    }
  }
  
  if (username) {
    const usernameLower = username.toLowerCase();
    if (TEST_USERNAMES.some(u => u.toLowerCase() === usernameLower)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Obtiene los feature flags para el usuario actual
 */
export function getFeatureFlags(userEmail?: string | null, username?: string | null): FeatureFlags {
  const isTestUser = canUseNewFeatures(userEmail, username);
  
  return {
    multipleReactions: isTestUser,
    shareWithQR: isTestUser,
    polls: isTestUser,
    personalizedFeed: isTestUser,
    profileEdit: isTestUser,
    groupPosts: isTestUser,
    groupRoles: isTestUser,
    hashtagsAndMentions: isTestUser,
    advancedSearch: isTestUser,
    searchPage: isTestUser,
    storiesPage: isTestUser,
    analyticsPage: isTestUser,
    groupsPage: isTestUser,
  };
}
