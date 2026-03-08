CREATE POLICY "Project leads can update company name"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_memberships
    WHERE company_id = companies.id
      AND user_id = auth.uid()
      AND role = 'project_lead'
      AND is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_memberships
    WHERE company_id = companies.id
      AND user_id = auth.uid()
      AND role = 'project_lead'
      AND is_active = true
  )
);