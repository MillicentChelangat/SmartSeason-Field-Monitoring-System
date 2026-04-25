export type FieldStage = 'planted' | 'growing' | 'ready' | 'harvested';
export type FieldStatus = 'active' | 'at_risk' | 'completed';
export type UserRole = 'admin' | 'field_agent';

export interface Profile {
  id: number;          
  user_id: number;     
  email?: string;
  full_name: string;
  role: UserRole;
}

export interface Field {
  id: number;                      
  name: string;
  crop_type: string;
  planting_date: string;
  current_stage: FieldStage;
  location: string;
  assigned_agent_id: number | null; 
  created_at: string;
  updated_at?: string;
}

export interface FieldUpdate {
  id: number;          
  field_id: number;    
  agent_id: number;    
  stage: FieldStage;
  notes: string;
  created_at: string;
}

export interface FieldWithExtras extends Field {
  status: FieldStatus;
  assignedAgents?: Profile[];
}

export interface FieldUpdateWithAgent extends FieldUpdate {
  agent?: Profile;
}