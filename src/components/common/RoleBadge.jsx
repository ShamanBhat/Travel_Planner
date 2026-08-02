// src/components/common/RoleBadge.jsx
import React from 'react'
import { Shield, Pencil, Eye } from 'lucide-react'
import { ROLES, roleLabel } from '../../utils/rbac'

const STYLES = {
  [ROLES.ADMIN]: 'bg-app-primary/15 text-app-primary border-app-primary/30',
  [ROLES.EDITOR]: 'bg-app-accent/15 text-app-accent border-app-accent/30',
  [ROLES.VIEWER]: 'bg-app-muted/15 text-app-muted border-app-muted/30',
}

const ICONS = {
  [ROLES.ADMIN]: Shield,
  [ROLES.EDITOR]: Pencil,
  [ROLES.VIEWER]: Eye,
}

export default function RoleBadge({ role, className = '' }) {
  const Icon = ICONS[role] || Eye
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
        STYLES[role] || STYLES[ROLES.VIEWER]
      } ${className}`}
    >
      <Icon size={12} />
      {roleLabel(role)}
    </span>
  )
}
