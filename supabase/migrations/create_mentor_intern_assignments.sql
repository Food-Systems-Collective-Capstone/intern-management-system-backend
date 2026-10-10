CREATE TABLE mentor_intern_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL
    REFERENCES shared_accounts(id) ON DELETE CASCADE,
  intern_id UUID NOT NULL
    REFERENCES shared_accounts(id) ON DELETE CASCADE,
  assigned_by UUID
    REFERENCES shared_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_mentor_intern_assignments_intern_id UNIQUE (intern_id),
  CONSTRAINT chk_mentor_intern_assignments_distinct_accounts
    CHECK (mentor_id <> intern_id)
);

CREATE INDEX idx_mentor_intern_assignments_mentor_id
  ON mentor_intern_assignments (mentor_id);

CREATE INDEX idx_mentor_intern_assignments_assigned_by
  ON mentor_intern_assignments (assigned_by);
