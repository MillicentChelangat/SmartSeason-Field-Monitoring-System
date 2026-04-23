import type { Field, FieldStatus, FieldUpdate } from '../types/database';

export function computeFieldStatus(field: Field, lastUpdate?: FieldUpdate | null): FieldStatus {
  if (field.current_stage === 'harvested') {
    return 'completed';
  }

  const today = new Date();
  const plantingDate = new Date(field.planting_date);
  const daysSincePlanting = Math.floor((today.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24));

  const stageMaxDays: Record<string, number> = {
    planted: 30,
    growing: 90,
    ready: 120,
  };

  const maxDays = stageMaxDays[field.current_stage] ?? 120;
  if (daysSincePlanting > maxDays) {
    return 'at_risk';
  }

  if (lastUpdate) {
    const daysSinceUpdate = Math.floor(
      (today.getTime() - new Date(lastUpdate.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate > 14) {
      return 'at_risk';
    }
  } else {
    const daysSinceCreation = Math.floor(
      (today.getTime() - new Date(field.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceCreation > 14) {
      return 'at_risk';
    }
  }

  return 'active';
}

export const statusLabels: Record<FieldStatus, string> = {
  active: 'Active',
  at_risk: 'At Risk',
  completed: 'Completed',
};

export const stageLabels: Record<string, string> = {
  planted: 'Planted',
  growing: 'Growing',
  ready: 'Ready',
  harvested: 'Harvested',
};
