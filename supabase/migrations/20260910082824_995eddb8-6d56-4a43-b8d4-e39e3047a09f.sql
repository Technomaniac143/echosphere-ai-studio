CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.candidate_profiles (
  user_id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  resume_path text,
  github_url text,
  institution text,
  degree text,
  department text,
  graduation_year integer,
  certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  profile_completion integer NOT NULL DEFAULT 0 CHECK (profile_completion BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_profiles TO authenticated;
GRANT ALL ON public.candidate_profiles TO service_role;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Candidates manage their own profile"
ON public.candidate_profiles FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER candidate_profiles_updated_at
BEFORE UPDATE ON public.candidate_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.interview_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  company text NOT NULL,
  role text NOT NULL,
  domain text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Expert')),
  interview_mode text NOT NULL DEFAULT 'Assessment / Mock Interview',
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'paused')),
  current_stage text NOT NULL DEFAULT 'Verify',
  overall_score integer CHECK (overall_score BETWEEN 0 AND 100),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_threads TO authenticated;
GRANT ALL ON public.interview_threads TO service_role;
ALTER TABLE public.interview_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Candidates manage their own interview threads"
ON public.interview_threads FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE INDEX interview_threads_user_updated_idx ON public.interview_threads(user_id, updated_at DESC);
CREATE TRIGGER interview_threads_updated_at
BEFORE UPDATE ON public.interview_threads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.interview_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.interview_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  ai_message_id text,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('submitted', 'streaming', 'completed', 'error')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_messages TO authenticated;
GRANT ALL ON public.interview_messages TO service_role;
ALTER TABLE public.interview_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Candidates manage messages in their threads"
ON public.interview_messages FOR ALL TO authenticated
USING (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.interview_threads t
    WHERE t.id = thread_id AND t.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.interview_threads t
    WHERE t.id = thread_id AND t.user_id = auth.uid()
  )
);
CREATE INDEX interview_messages_thread_created_idx ON public.interview_messages(thread_id, created_at ASC);
CREATE TRIGGER interview_messages_updated_at
BEFORE UPDATE ON public.interview_messages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();