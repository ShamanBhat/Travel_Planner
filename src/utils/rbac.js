// src/utils/rbac.js
// Centralized role-based access control helpers used across all trip modules.
export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
}

export function isAdmin(role) {
  return role === ROLES.ADMIN
}

export function isEditor(role) {
  return role === ROLES.ADMIN || role === ROLES.EDITOR
}

export function canEdit(role) {
  return isEditor(role)
}

export function canManageMembers(role) {
  return isAdmin(role)
}

export function roleLabel(role) {
  switch (role) {
    case ROLES.ADMIN:
      return 'Admin'
    case ROLES.EDITOR:
      return 'Editor'
    case ROLES.VIEWER:
      return 'Viewer'
    default:
      return 'Unknown'
  }
}
