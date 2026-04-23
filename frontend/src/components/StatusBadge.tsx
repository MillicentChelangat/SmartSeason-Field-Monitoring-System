import type { FieldStatus } from '../types/database';

const config: Record<FieldStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  at_risk: { label: 'At Risk', className: 'bg-amber-100 text-amber-800 border border-amber-200' },
  completed: { label: 'Completed', className: 'bg-slate-100 text-slate-600 border border-slate-200' },
};

export function StatusBadge({ status }: { status: FieldStatus }) {
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
