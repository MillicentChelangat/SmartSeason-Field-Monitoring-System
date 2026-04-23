import type { FieldStage } from '../types/database';

const config: Record<string, { label: string; className: string }> = {
  planted:  { label: 'Planted',  className: 'bg-sky-100 text-sky-800 border border-sky-200' },
  growing:  { label: 'Growing',  className: 'bg-teal-100 text-teal-800 border border-teal-200' },
  ready:    { label: 'Ready',    className: 'bg-orange-100 text-orange-800 border border-orange-200' },
  harvested:{ label: 'Harvested',className: 'bg-stone-100 text-stone-700 border border-stone-200' },
};

export function StageBadge({ stage }: { stage: FieldStage }) {
  const key = stage?.toLowerCase();                         
  const { label, className } = config[key] ?? {             
    label: stage ?? 'Unknown',
    className: 'bg-slate-100 text-slate-600 border border-slate-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}