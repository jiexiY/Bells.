import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MemberInfo {
  user_id: string;
  name: string;
  role: string;
  department: string | null;
  is_active: boolean;
}

export function MembersPanel() {
  const { activeCompanyId } = useCompany();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["company-members", activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data: memberships, error } = await supabase
        .from("company_memberships")
        .select("user_id, role, department, is_active")
        .eq("company_id", activeCompanyId!);
      if (error) throw error;

      const userIds = memberships.map((m) => m.user_id);
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", userIds);
      if (pErr) throw pErr;

      return memberships.map((m): MemberInfo => {
        const profile = profiles?.find((p) => p.user_id === m.user_id);
        return {
          user_id: m.user_id,
          name: profile?.name || "Unknown",
          role: m.role,
          department: m.department,
          is_active: m.is_active,
        };
      });
    },
  });

  if (isLoading) {
    return <p className="text-xs text-muted-foreground px-2 py-1">Loading…</p>;
  }

  if (members.length === 0) {
    return <p className="text-xs text-muted-foreground px-2 py-1">No members yet</p>;
  }

  return (
    <div className="space-y-1">
      {members.map((m) => (
        <div
          key={m.user_id}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
        >
          <div className="relative">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                {m.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                m.is_active ? "bg-green-500" : "bg-muted-foreground/40"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{m.name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">
              {m.role.replace("_", " ")}
              {m.department ? ` · ${m.department}` : ""}
            </p>
          </div>
          <span
            className={cn(
              "text-[10px] font-medium shrink-0",
              m.is_active ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}
          >
            {m.is_active ? "Active" : "Away"}
          </span>
        </div>
      ))}
    </div>
  );
}
