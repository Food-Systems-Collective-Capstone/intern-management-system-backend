export interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: Date | null;
  status: string;
  priority: string | null;
  assigned_intern_id: string;
  assigned_by_mentor_id: string;
  reference_file_url: string | null;
  reference_file_name: string | null;
  reference_attachment_url?: string | null;
  created_at: Date;
  updated_at: Date;
}