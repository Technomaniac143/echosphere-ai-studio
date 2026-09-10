-- EchoSphere Stage 1 schema extensions

-- Candidate photos: private storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-photos', 'candidate-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own photos
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

-- Add photo path to candidate_profiles
ALTER TABLE public.candidate_profiles
ADD COLUMN IF NOT EXISTS photo_path text;

-- Add scoring and transcript fields to interview_threads
ALTER TABLE public.interview_threads
ADD COLUMN IF NOT EXISTS transcript text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS competency_scores jsonb;

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

-- Drop existing trigger if any and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
