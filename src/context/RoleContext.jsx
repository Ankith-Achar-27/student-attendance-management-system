/**
 * RoleContext (Deprecated alias for AuthContext in Phase 3)
 * Re-exports AuthContext to maintain backwards compatibility with existing views.
 */

export { AuthProvider as RoleProvider, useRole, useAuth } from './AuthContext';
export { ROLES } from '../services/authService';
