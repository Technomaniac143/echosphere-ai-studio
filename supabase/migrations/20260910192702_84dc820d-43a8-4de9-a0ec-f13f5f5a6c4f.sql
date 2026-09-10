-- Interview messages table
CREATE TABLE IF NOT EXISTS public.interview_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content jsonb NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','pending','error')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_messages TO authenticated;
GRANT ALL ON public.interview_messages TO service_role;
ALTER TABLE public.interview_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates manage own interview messages"
ON public.interview_messages FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX interview_messages_thread_idx ON public.interview_messages(thread_id, created_at DESC);

CREATE TRIGGER interview_messages_updated_at
BEFORE UPDATE ON public.interview_messages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon;