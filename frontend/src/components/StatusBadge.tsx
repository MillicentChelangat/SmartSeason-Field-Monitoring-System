import type { FieldStatus } from '../types/database';

const config: Record<FieldStatus, { label: string; className: string }> = {
  healthy:  { label: 'Healthy',  className: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  at_risk:  { label: 'At Risk',  className: 'bg-amber-100 text-amber-800 border border-amber-200' },
  critical: { label: 'Critical', className: 'bg-red-100 text-red-700 border border-red-200' },
  monitor:  { label: 'Monitor',  className: 'bg-blue-100 text-blue-700 border border-blue-200' },
};

export function StatusBadge({ status }: { status: FieldStatus }) {
  const cfg = config[status] ?? config['monitor'];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}