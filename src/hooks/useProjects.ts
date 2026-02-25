import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectRow[];
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
