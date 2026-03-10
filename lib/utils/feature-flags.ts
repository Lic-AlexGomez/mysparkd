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
 * TODAS LAS FUNCIONALIDADES ACTIVADAS PARA TODOS LOS USUARIOS
 */
export function getFeatureFlags(userEmail?: string | null, username?: string | null): FeatureFlags {
  // Activar todas las features para todos los usuarios
  return {
    multipleReactions: true,      // ✅ Reacciones múltiples activadas
    shareWithQR: true,            // ✅ Compartir con QR activado
    polls: true,                  // ✅ Encuestas activadas
    personalizedFeed: true,       // ✅ Feed personalizado activado
    profileEdit: true,            // ✅ Edición de perfil activada
    groupPosts: true,             // ✅ Posts en grupos activados
    groupRoles: true,             // ✅ Roles en grupos activados
    hashtagsAndMentions: true,    // ✅ Hashtags y menciones activados
    advancedSearch: true,         // ✅ Búsqueda avanzada activada
    searchPage: true,             // ✅ Página de búsqueda activada
    storiesPage: true,            // ✅ Página de stories activada
    analyticsPage: true,          // ✅ Página de analytics activada
    groupsPage: true,             // ✅ Página de grupos activada
  };
}
