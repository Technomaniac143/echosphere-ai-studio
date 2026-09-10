-- EchoSphere Stage 1 schema

-- Helper updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Candidate profiles
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text,
  full_name text,
  github_url text,
  institution text,
  degree text,
  department text,
  graduation_year integer,
  certifications jsonb DEFAULT '[]'::jsonb,
  photo_path text,
  profile_completion integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_profiles TO authenticated;
GRANT ALL ON public.candidate_profiles TO service_role;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates manage own profile"
ON public.candidate_profiles FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER candidate_profiles_updated_at
BEFORE UPDATE ON public.candidate_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Interview threads
CREATE TABLE IF NOT EXISTS public.interview_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company text NOT NULL,
  role text NOT NULL,
  domain text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  transcript text,
  notes text,
  cumulative_score integer,
  competency_scores jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_threads TO authenticated;
GRANT ALL ON public.interview_threads TO service_role;
ALTER TABLE public.interview_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates manage own interviews"
ON public.interview_threads FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER interview_threads_updated_at
BEFORE UPDATE ON public.interview_threads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Candidate photos RLS policies
CREATE POLICY "Candidates can upload their own photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'candidate-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Candidates can read their own photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'candidate-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Candidates can update their own photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'candidate-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Candidates can delete their own photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'candidate-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Roadmap progress table
CREATE TABLE IF NOT EXISTS public.roadmap_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  dimension text NOT NULL,
  weeks text,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('done', 'current', 'upcoming')),
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_progress TO authenticated;
GRANT ALL ON public.roadmap_progress TO service_role;
ALTER TABLE public.roadmap_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates manage their own roadmap progress"
ON public.roadmap_progress FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX roadmap_progress_user_order_idx ON public.roadmap_progress(user_id, order_index ASC);

CREATE TRIGGER roadmap_progress_updated_at
BEFORE UPDATE ON public.roadmap_progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger to auto-create a profile row on auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.candidate_profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();