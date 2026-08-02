export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

export function canEditRole(role) {
  return role === ROLES.ADMIN || role === ROLES.EDITOR;
}

export function roleLabel(role) {
  const labels = { admin: 'Admin', editor: 'Editor', viewer: 'Viewer' };
  return labels[role] || role;
}

export function getMemberDisplayName(members, uid, usersCache = {}) {
  if (usersCache[uid]?.displayName) return usersCache[uid].displayName;
  if (members?.[uid]?.displayName) return members[uid].displayName;
  return uid?.slice(0, 6) + '…';
}
