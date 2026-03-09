import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

export interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  lead_id: string | null;
  lead_name: string | null;
  department: "tech" | "marketing" | "research";
  created_at: string;
  due_date: string;
  company_id: string | null;
}

export function useProjects() {
  const { activeCompanyId } = useCompany();
  return useQuery({
    queryKey: ["projects", activeCompanyId],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (activeCompanyId) {
        query = query.eq("company_id", activeCompanyId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as ProjectRow[];
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const { activeCompanyId } = useCompany();
  return useMutation({
    mutationFn: async (project: Omit<ProjectRow, "id" | "created_at" | "company_id">) => {
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...project, company_id: activeCompanyId } as any)
        .select()
        .single();
      if (error) throw error;
      return data as ProjectRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", activeCompanyId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectRow> & { id: string }) => {
      const { error } = await supabase.from("projects").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}
