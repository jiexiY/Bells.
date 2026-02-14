import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CompanyRow {
  id: string;
  name: string;
  logo_url: string | null;
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

export function useCreateCompany() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ name, role, department }: { name: string; role: "project_lead" | "team_lead" | "member"; department?: string }) => {
      // Insert company without chaining .select() to avoid RLS SELECT restriction
      const { data: insertData, error } = await supabase
        .from("companies")
        .insert({ name })
        .select("id")
        .single();
      
      // If select fails due to RLS, try fetching via a workaround
      let companyId: string;
      if (error) {
        // Fallback: insert without select, then query after membership is created
        const { error: insertError } = await supabase
          .from("companies")
          .insert({ name });
        if (insertError) throw insertError;
        // We need to find the company - query by name (temporary)
        // Better approach: add RLS policy
        throw new Error("Company created but could not retrieve ID. Please refresh.");
      } else {
        companyId = insertData.id;
      }

      // Auto-join the company
      const { error: memberError } = await supabase
        .from("company_memberships")
        .insert({
          user_id: user!.id,
          company_id: companyId,
          role,
          department: department as any || null,
        });
      if (memberError) throw memberError;
      return { id: companyId, name };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      qc.invalidateQueries({ queryKey: ["company_memberships"] });
    },
  });
}
