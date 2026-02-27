import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TaskSubmission {
  id: string;
  task_id: string;
  submitted_by: string;
  submission_type: string;
  submission_url: string | null;
  submission_file_url: string | null;
  comment: string | null;
  attempt_number: number;
  created_at: string;
}

export function useTaskSubmissions(taskId: string | null) {
  return useQuery({
    queryKey: ["task_submissions", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_submissions")
        .select("*")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TaskSubmission[];
    },
  });
}

export function useCreateTaskSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (submission: Omit<TaskSubmission, "id" | "created_at">) => {
      const { error } = await supabase.from("task_submissions").insert(submission as any);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["task_submissions", variables.task_id] });
    },
  });
}
