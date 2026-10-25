export type NoteStatus = 'draft' | 'published';

export interface Note {
  id: string;
  title: string;
  subject: string;
  unit: string;
  description: string;
  class_id: string;
  file_path: string;
  file_type: string;
  size_bytes: number;
  uploaded_by: string;
  teacher_name: string;
  uploaded_at: string;
  status: NoteStatus;
  allow_download: boolean;
  structured_content?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface NoteFormData {
  title: string;
  subject: string;
  unit: string;
  description: string;
  class_id: string;
  allow_download: boolean;
  status: NoteStatus;
}

export interface NoteStudentProgress {
  id?: string;
  user_id: string;
  note_id: string;
  is_read: boolean;
  read_at?: string | null;
  progress_percent: number;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface TruthTableRow {
  inputs: Record<string, string | number>;
  outputs: Record<string, string | number>;
}

export interface AssignmentQuestion {
  id: number;
  group: string;
  title: string;
  question: string;
  solution: string;
  truthTable?: TruthTableRow[];
  truthTableHeaders?: { inputs: string[]; outputs: string[] };
}
