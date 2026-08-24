CREATE TABLE shared_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'applicant',
    auth_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at date NOT NULL default now(),
    updated_at date NOT NULL default now()
);

CREATE TABLE person_profile(
    person_id UUID PRIMARY KEY REFERENCES shared_accounts(id) ON DELETE CASCADE,
    firstName text NOT NULL,
    lastNAme text NOT NULL,
    phone text NOT NULL UNIQUE,
    email text NOT NULL UNIQUE,
    university text NOT NULL,
    degree text NOT NULL,
    resume_url text NOT NULL,
    application_status text NOT NULL default 'pending',
    created_at date NOT NULL default now(),
    updated_at date NOT NULL default now()
);