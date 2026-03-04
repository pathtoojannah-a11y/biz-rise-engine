
-- Fix permissive workspace INSERT policy
DROP POLICY "Authenticated users can create workspace" ON public.workspaces;
CREATE POLICY "Authenticated users can create workspace" ON public.workspaces FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
