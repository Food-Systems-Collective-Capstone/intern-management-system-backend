ALTER TABLE person_profile
    ADD COLUMN is_locked BOOLEAN DEFAULT false,
    ADD COLUMN promoted_at TIMESTAMP, 
    ADD COLUMN promoted_by UUID REFERENCES shared_accounts(id);