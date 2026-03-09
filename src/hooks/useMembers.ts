import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

export interface MemberRow {
  user_id: string;
  name: string;
  email: string;
  department: "tech" | "marketing" | "research" | null;
  role: "project_lead" | "team_lead" | "member";
}

export function useMembers(department?: string) {
  const { activeCompanyId } = useCompany();
  
  return useQuery({
    queryKey: ["members", activeCompanyId, department],
    queryFn: async () => {
      if (!activeCompanyId) return [];

      // Get active company members with their roles and profile info
      const { data: members, error } = await supabase
        .from("company_memberships")
        .select(`
          user_id,
          role,
          department,
          profiles!inner (
            name,
            email
          )
        `)
        .eq("company_id", activeCompanyId)
        .eq("is_active", true);

      if (error) throw error;

      const memberRows: MemberRow[] = members.map((m) => ({
        user_id: m.user_id,
        name: m.profiles?.name || "",
        email: m.profiles?.email || "",
        department: m.department as MemberRow["department"],
        role: m.role as MemberRow["role"],
      }));

      if (department) {
        return memberRows.filter((m) => m.role === "member" && m.department === department);
      }
      return memberRows;
    },
    enabled: !!activeCompanyId,
  });
}
