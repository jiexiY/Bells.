import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  project_id: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  assignee_name: string | null;
  due_date: string;
  created_at: string;
  submission_type: string | null;
  submission_url: string | null;
  submission_file_url: string | null;
  company_id: string | null;
}

export function useTasks() {
  const { activeCompanyId } = useCompany();
  return useQuery({
    queryKey: ["tasks", activeCompanyId],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (activeCompanyId) {
        query = query.eq("company_id", activeCompanyId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as TaskRow[];
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { activeCompanyId } = useCompany();
  return useMutation({
    mutationFn: async (task: Omit<TaskRow, "id" | "created_at" | "submission_type" | "submission_url" | "submission_file_url" | "company_id">) => {
      const { error } = await supabase.from("tasks").insert({ ...task, company_id: activeCompanyId } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", activeCompanyId] });
      qc.invalidateQueries({ queryKey: ["tasks"] }); // Also invalidate general tasks queries
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const { activeCompanyId } = useCompany();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskRow> & { id: string }) => {
      const { error } = await supabase.from("tasks").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", activeCompanyId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
