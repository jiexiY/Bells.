import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MemberRow {
  user_id: string;
  name: string;
  email: string;
  department: "tech" | "marketing" | "research" | null;
  role: "project_lead" | "team_lead" | "member";
}

export function useMembers(department?: string) {
  return useQuery({
    queryKey: ["members", department],
    queryFn: async () => {
      // Join profiles with user_roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role, department");
      if (rolesError) throw rolesError;

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name, email");
      if (profilesError) throw profilesError;

      const members: MemberRow[] = roles.map((r) => {
        const profile = profiles.find((p) => p.user_id === r.user_id);
        return {
          user_id: r.user_id,
          name: profile?.name || "",
          email: profile?.email || "",
          department: r.department as MemberRow["department"],
          role: r.role as MemberRow["role"],
        };
      });

      if (department) {
        return members.filter((m) => m.role === "member" && m.department === department);
      }
      return members;
    },
  });
}
