ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS reference_file_url text,
ADD COLUMN IF NOT EXISTS reference_file_name text;
