export type FieldStage = 'planted' | 'growing' | 'ready' | 'harvested';
export type FieldStatus = 'healthy' | 'monitor' |'at_risk' | 'critical' ;
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
  status: FieldStatus;
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

export type IssueType = 
  | 'pest' 
  | 'disease' 
  | 'drought' 
  | 'flood' 
  | 'crop_failure' 
  | 'poor_germination' 
  | 'nutrient_deficiency' 
  | 'other'

export type IssueSeverity = 'low' | 'medium' | 'high'

export type IssueStatus = 'open' | 'in_progress' | 'resolved'

export interface FieldIssue {
  id: number
  field_id: number
  field_name: string
  reported_by_id: number
  reported_by_name: string
  issue_type: IssueType
  severity: IssueSeverity
  description: string
  status: IssueStatus
  created_at: string
  updated_at: string
}