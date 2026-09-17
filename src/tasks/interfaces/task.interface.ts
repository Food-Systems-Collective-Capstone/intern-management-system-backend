export interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: Date | null;
  status: string;
  priority: string | null;
  assigned_intern_id: string;
  assigned_by_mentor_id: string;
  created_at: Date;
  updated_at: Date;
}
