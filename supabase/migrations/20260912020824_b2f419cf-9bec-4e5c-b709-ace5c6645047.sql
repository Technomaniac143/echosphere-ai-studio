-- 1. Interview scoring + monitoring columns
ALTER TABLE public.interview_threads
  ADD COLUMN IF NOT EXISTS technical_score integer,
  ADD COLUMN IF NOT EXISTS behavioral_score integer,
  ADD COLUMN IF NOT EXISTS product_manager_score integer,
  ADD COLUMN IF NOT EXISTS hiring_manager_score integer,
  ADD COLUMN IF NOT EXISTS evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS lost_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS github_context jsonb,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS termination_reason text,
  ADD COLUMN IF NOT EXISTS turn_away_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS language_violation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cheating_violation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS camera_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS microphone_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS screen_share_status text NOT NULL DEFAULT 'unknown';

-- 2. Candidate profile extra fields
ALTER TABLE public.candidate_profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS experience text,
  ADD COLUMN IF NOT EXISTS best_project_url text,
  ADD COLUMN IF NOT EXISTS github_analysis jsonb;

-- 3. Monitoring events log
CREATE TABLE IF NOT EXISTS public.monitoring_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.interview_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.monitoring_events TO authenticated;
GRANT ALL ON public.monitoring_events TO service_role;
ALTER TABLE public.monitoring_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Candidates manage own monitoring events"
  ON public.monitoring_events FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS monitoring_events_thread_idx ON public.monitoring_events(thread_id);

-- 4. Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  website text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members m WHERE m.user_id = _user_id AND m.organization_id = _org_id);
$$;

CREATE OR REPLACE FUNCTION public.is_any_org_member(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members m WHERE m.user_id = _user_id);
$$;

CREATE POLICY "Members read their organization" ON public.organizations
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), id));
CREATE POLICY "Anyone signed in can create an organization" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owners update their organization" ON public.organizations
  FOR UPDATE TO authenticated USING (public.is_org_member(auth.uid(), id))
  WITH CHECK (public.is_org_member(auth.uid(), id));

CREATE POLICY "Members read own membership rows" ON public.organization_members
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create their own membership" ON public.organization_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove their own membership" ON public.organization_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. Organization interview patterns
CREATE TABLE IF NOT EXISTS public.interview_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  title text NOT NULL,
  file_path text,
  content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_patterns TO authenticated;
GRANT ALL ON public.interview_patterns TO service_role;
ALTER TABLE public.interview_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage patterns" ON public.interview_patterns
  FOR ALL TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

-- 6. Organizations can read completed candidate results for ranking
CREATE POLICY "Org members read completed interviews" ON public.interview_threads
  FOR SELECT TO authenticated
  USING (status = 'completed' AND public.is_any_org_member(auth.uid()));
CREATE POLICY "Org members read candidate profiles" ON public.candidate_profiles
  FOR SELECT TO authenticated
  USING (public.is_any_org_member(auth.uid()));

-- 7. updated_at triggers
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER interview_patterns_updated_at BEFORE UPDATE ON public.interview_patterns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();