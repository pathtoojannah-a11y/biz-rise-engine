-- Ensure authenticated users can create a workspace and are attached as owner immediately.

DROP POLICY IF EXISTS "Authenticated users can create workspace" ON public.workspaces;
CREATE POLICY "Authenticated users can create workspace" ON public.workspaces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.handle_workspace_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
    VALUES (NEW.id, auth.uid(), 'owner', 'active')
    ON CONFLICT (workspace_id, user_id) DO UPDATE
      SET role = EXCLUDED.role,
          status = EXCLUDED.status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_workspace_created ON public.workspaces;
CREATE TRIGGER on_workspace_created
AFTER INSERT ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.handle_workspace_created();
