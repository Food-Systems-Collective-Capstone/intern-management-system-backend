export interface TaskSubmission {
  id: string;
  task_id: string;
  submitted_by_intern_id: string;
  description: string | null;
  file_url: string | null;
  created_at: Date;
  updated_at: Date;
  submitted_at: Date;
}

export interface TaskSubmissionResult {
  submission: TaskSubmission;
  task: {
    id: string;
    status: string;
    updated_at: Date;
  };
}