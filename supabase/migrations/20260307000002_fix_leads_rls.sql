-- Substitui a política de leads por uma baseada em role Admin,
-- eliminando dependência frágil do campo created_by
DROP POLICY IF EXISTS "Admin owns leads" ON public.leads;

CREATE POLICY "Admin can manage leads"
  ON public.leads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.collaborators
      WHERE collaborators.id = auth.uid()
        AND collaborators.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collaborators
      WHERE collaborators.id = auth.uid()
        AND collaborators.role = 'Admin'
    )
  );
