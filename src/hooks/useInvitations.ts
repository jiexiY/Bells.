import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";

export interface InvitationRow {
  id: string;
  company_id: string;
  email: string;
  role: "project_lead" | "team_lead" | "member";
  department: "tech" | "marketing" | "research" | null;
  invited_by: string;
  status: string;
  created_at: string;
  responded_at: string | null;
}

/** Invitations sent for the active company (visible to leads) */
export function useCompanyInvitations() {
  const { activeCompanyId } = useCompany();
  return useQuery({
    queryKey: ["invitations", "company", activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("company_id", activeCompanyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as InvitationRow[];
    },
  });
}

/** Pending invitations for the logged-in user */
export function useMyInvitations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["invitations", "mine"],
    enabled: !!user,
    queryFn: async () => {
      // Get user email from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", user!.id)
        .single();
      if (!profile) return [];

      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("email", profile.email)
        .eq("status", "pending");
      if (error) throw error;
      return data as InvitationRow[];
    },
  });
}

export function useSendInvitation() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { activeCompanyId } = useCompany();
  return useMutation({
    mutationFn: async ({
      email,
      role,
      department,
    }: {
      email: string;
      role: "project_lead" | "team_lead" | "member";
      department?: "tech" | "marketing" | "research";
    }) => {
      const { data, error } = await supabase
        .from("invitations")
        .insert({
          company_id: activeCompanyId!,
          email,
          role,
          department: department || null,
          invited_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}

export function useRespondInvitation() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      invitation,
      accept,
    }: {
      invitation: InvitationRow;
      accept: boolean;
    }) => {
      // Update invitation status
      const { error: updateErr } = await supabase
        .from("invitations")
        .update({
          status: accept ? "accepted" : "declined",
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);
      if (updateErr) throw updateErr;

      // If accepted, create company membership
      if (accept) {
        const { error: memberErr } = await supabase
          .from("company_memberships")
          .insert({
            user_id: user!.id,
            company_id: invitation.company_id,
            role: invitation.role,
            department: invitation.department,
          });
        if (memberErr) throw memberErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
      qc.invalidateQueries({ queryKey: ["companies"] });
      qc.invalidateQueries({ queryKey: ["company_memberships"] });
    },
  });
}
