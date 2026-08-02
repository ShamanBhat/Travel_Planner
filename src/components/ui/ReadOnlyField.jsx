import { Pencil } from 'lucide-react';

export default function ReadOnlyField({ label, value, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <p className="text-xs font-medium uppercase tracking-wide opacity-60">{label}</p>}
      <p className="text-sm">{value || '—'}</p>
    </div>
  );
}

export function EditButton({ onClick, label = 'Edit' }) {
  return (
    <button
      onClick={onClick}
      className="btn-secondary !px-3 !py-1.5 text-xs"
      aria-label={label}
    >
      <Pencil size={14} />
      {label}
    </button>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
      {Icon && <Icon size={40} className="mb-3" />}
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 text-sm">{description}</p>}
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
    </div>
  );
}
