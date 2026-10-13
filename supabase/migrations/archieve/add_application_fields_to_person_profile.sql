ALTER TABLE person_profile
    ADD COLUMN address TEXT NOT NULL,
    ADD COLUMN city TEXT NOT NULL, 
    ADD COLUMN state TEXT NOT NULL,
    ADD COLUMN post_code TEXT NOT NULL,
    ADD COLUMN graduation_year INTEGER NOT NULL, 
    ADD COLUMN cover_letter_URL text,
    ADD COLUMN motivation TEXT NOT NULL;