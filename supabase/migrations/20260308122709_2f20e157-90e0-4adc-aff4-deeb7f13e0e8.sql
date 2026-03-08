
-- Create a SECURITY DEFINER function to check company membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_memberships
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND is_active = true
  )
$$;

-- Create a SECURITY DEFINER function to get user's company IDs
CREATE OR REPLACE FUNCTION public.get_user_company_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.company_memberships
  WHERE user_id = _user_id AND is_active = true
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Members see company memberships" ON public.company_memberships;

-- Recreate it using the SECURITY DEFINER function
CREATE POLICY "Members see company memberships"
ON public.company_memberships
FOR SELECT
USING (
  company_id IN (SELECT public.get_user_company_ids(auth.uid()))
);
