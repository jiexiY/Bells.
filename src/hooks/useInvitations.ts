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
        .ilike("email", profile.email.trim())
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
      inviterName,
    }: {
      email: string;
      role: "project_lead" | "team_lead" | "member";
      department?: "tech" | "marketing" | "research";
      inviterName?: string;
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

      // Fetch company name for the email
      let companyName = "the organization";
      try {
        const { data: company } = await supabase
          .from("companies")
          .select("name")
          .eq("id", activeCompanyId!)
          .single();
        if (company) companyName = company.name;
      } catch {}

      // Send invite email (fire-and-forget, don't block on failure)
      try {
        await supabase.functions.invoke("send-invite-email", {
          body: { email, companyName, inviterName, role },
        });
      } catch (emailErr) {
        console.error("Failed to send invite email:", emailErr);
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}

export function useRespondInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      invitation,
      accept,
    }: {
      invitation: InvitationRow;
      accept: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke("respond-invitation", {
        body: { invitation_id: invitation.id, accept },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
      qc.invalidateQueries({ queryKey: ["companies"] });
      qc.invalidateQueries({ queryKey: ["company_memberships"] });
      qc.invalidateQueries({ queryKey: ["user_roles"] });
    },
  });
}
