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

export interface MentorSubmissionReview {
  task_id: string;
  title: string;
  task_description: string | null;
  due_date: Date | null;
  priority: string;
  status: string;
  assigned_intern_id: string;
  assigned_by_mentor_id: string;
  intern_name: string;
  intern_email: string;
  submission_id: string | null;
  submission_description: string | null;
  file_url: string | null;
  file_name: string | null;
  attachment_url: string | null;
  submitted_at: Date | null;
}

export interface MentorTaskCompletionResult {
  id: string;
  status: string;
  updated_at: Date;
}
