export type FieldStage = 'planted' | 'growing' | 'ready' | 'harvested';
export type FieldStatus = 'active' | 'at_risk' | 'completed';
export type UserRole = 'admin' | 'field_agent';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<Profile, 'id'>>;
      };
      fields: {
        Row: Field;
        Insert: Omit<Field, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<Field, 'id' | 'created_at'>>;
      };
      field_assignments: {
        Row: FieldAssignment;
        Insert: Omit<FieldAssignment, 'id' | 'assigned_at'> & { id?: string; assigned_at?: string };
        Update: Partial<Omit<FieldAssignment, 'id'>>;
      };
      field_updates: {
        Row: FieldUpdate;
        Insert: Omit<FieldUpdate, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<FieldUpdate, 'id' | 'created_at'>>;
      };
    };
  };
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Field {
  id: string;
  name: string;
  crop_type: string;
  planting_date: string;
  current_stage: FieldStage;
  location: string;
  size_hectares: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FieldAssignment {
  id: string;
  field_id: string;
  agent_id: string;
  assigned_at: string;
  assigned_by: string | null;
}

export interface FieldUpdate {
  id: string;
  field_id: string;
  agent_id: string;
  stage: FieldStage;
  notes: string;
  created_at: string;
}

export interface FieldWithAssignments extends Field {
  field_assignments?: (FieldAssignment & { profiles?: Profile })[];
}

export interface FieldUpdateWithAgent extends FieldUpdate {
  profiles?: Profile;
}
