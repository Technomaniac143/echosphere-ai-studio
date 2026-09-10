ALTER TABLE public.interview_threads
  ADD COLUMN IF NOT EXISTS overall_score integer,
  ADD COLUMN IF NOT EXISTS strengths text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS improvements text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recommendation text,
  ADD COLUMN IF NOT EXISTS panel_scores jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_interview_threads_overall_score ON public.interview_threads(overall_score);
