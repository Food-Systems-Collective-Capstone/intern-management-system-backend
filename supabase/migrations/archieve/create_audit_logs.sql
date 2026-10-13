CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES shared_accounts(id),
    previous_state TEXT NOT NULL,
    new_state TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES shared_accounts(id),
    created_at TIMESTAMP DEFAULT now()
);