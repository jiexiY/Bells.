import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CompanyRow {
  id: string;
  name: string;
  logo_url: string | null;
  invite_code: string;
  created_at: string;
}

export interface CompanyMembershipRow {
  id: string;
  user_id: string;
  company_id: string;
  role: "project_lead" | "team_lead" | "member";
  department: "tech" | "marketing" | "research" | null;
  is_active: boolean;
  created_at: string;
}

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as CompanyRow[];
    },
  });
}

export function useCompanyMemberships() {
  return useQuery({
    queryKey: ["company_memberships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_memberships")
        .select("*");
      if (error) throw error;
      return data as CompanyMembershipRow[];
    },
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      qc.invalidateQueries({ queryKey: ["company_memberships"] });
    },
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ name, role, department }: { name: string; role: "project_lead" | "team_lead" | "member"; department?: string }) => {
      const { data: company, error } = await supabase
        .from("companies")
        .insert({ name })
        .select()
        .single();
      if (error) throw error;

      const { error: memberError } = await supabase
        .from("company_memberships")
        .insert({
          user_id: user!.id,
          company_id: company.id,
          role,
          department: department as any || null,
        });
      if (memberError) throw memberError;
      return company;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      qc.invalidateQueries({ queryKey: ["company_memberships"] });
    },
  });
}
