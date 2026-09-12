CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members m WHERE m.user_id = _user_id AND m.organization_id = _org_id);
$$;

CREATE OR REPLACE FUNCTION private.is_any_org_member(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members m WHERE m.user_id = _user_id);
$$;

GRANT EXECUTE ON FUNCTION private.is_org_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_any_org_member(uuid) TO authenticated;

DROP POLICY IF EXISTS "Members read their organization" ON public.organizations;
DROP POLICY IF EXISTS "Owners update their organization" ON public.organizations;
DROP POLICY IF EXISTS "Org members manage patterns" ON public.interview_patterns;
DROP POLICY IF EXISTS "Org members read completed interviews" ON public.interview_threads;
DROP POLICY IF EXISTS "Org members read candidate profiles" ON public.candidate_profiles;

CREATE POLICY "Members read their organization" ON public.organizations
  FOR SELECT TO authenticated USING (private.is_org_member(auth.uid(), id));
CREATE POLICY "Owners update their organization" ON public.organizations
  FOR UPDATE TO authenticated USING (private.is_org_member(auth.uid(), id))
  WITH CHECK (private.is_org_member(auth.uid(), id));
CREATE POLICY "Org members manage patterns" ON public.interview_patterns
  FOR ALL TO authenticated
  USING (private.is_org_member(auth.uid(), organization_id))
  WITH CHECK (private.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members read completed interviews" ON public.interview_threads
  FOR SELECT TO authenticated
  USING (status = 'completed' AND private.is_any_org_member(auth.uid()));
CREATE POLICY "Org members read candidate profiles" ON public.candidate_profiles
  FOR SELECT TO authenticated
  USING (private.is_any_org_member(auth.uid()));

DROP FUNCTION IF EXISTS public.is_org_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_any_org_member(uuid);