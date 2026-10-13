CREATE TABLE shared_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'Applicant',
    auth_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at date NOT NULL default now(),
    updated_at date NOT NULL default now()
);

CREATE TABLE person_profile(
    person_id UUID PRIMARY KEY REFERENCES shared_accounts(id) ON DELETE CASCADE,
    firstname text NOT NULL,
    lastname text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL UNIQUE,
    university text NOT NULL,
    degree text NOT NULL,
    resume_url text,
    application_status text NOT NULL default 'Applied',
    created_at date NOT NULL default now(),
    updated_at date NOT NULL default now(),
    address TEXT NOT NULL,
    city TEXT NOT NULL, 
    state TEXT NOT NULL,
    post_code TEXT NOT NULL,
    country TEXT NOT NULL,
    graduation_year INTEGER NOT NULL, 
    motivation TEXT NOT NULL,
    is_locked BOOLEAN DEFAULT false,
    promoted_at TIMESTAMP, 
    promoted_by UUID REFERENCES shared_accounts(id),
    date_of_birth DATE NOT NULL,
    linkedin_url TEXT NOT NULL
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES shared_accounts(id),
    previous_state TEXT NOT NULL,
    new_state TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES shared_accounts(id),
    created_at TIMESTAMP DEFAULT now()
);