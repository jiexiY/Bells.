import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const invitation_id = body?.invitation_id;
    const accept = body?.accept;

    if (!invitation_id || typeof invitation_id !== "string") {
      return new Response(JSON.stringify({ error: "invitation_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof accept !== "boolean") {
      return new Response(JSON.stringify({ error: "accept must be boolean" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Load invitation
    const { data: invitation, error: invErr } = await adminClient
      .from("invitations")
      .select("id, company_id, email, role, department, status")
      .eq("id", invitation_id)
      .single();

    if (invErr || !invitation) {
      return new Response(JSON.stringify({ error: "Invitation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = (user.email || "").trim().toLowerCase();
    const inviteEmail = (invitation.email || "").trim().toLowerCase();

    if (!userEmail || userEmail !== inviteEmail) {
      return new Response(JSON.stringify({ error: "This invitation does not belong to you" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invitation.status !== "pending") {
      return new Response(
        JSON.stringify({ error: `Invitation already ${invitation.status}` }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Update invitation status
    const { error: updErr } = await adminClient
      .from("invitations")
      .update({
        status: accept ? "accepted" : "declined",
        responded_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    if (updErr) {
      return new Response(JSON.stringify({ error: "Failed to update invitation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If accepted: activate or create membership + align user_roles
    if (accept) {
      const { data: existingMembership } = await adminClient
        .from("company_memberships")
        .select("id, is_active")
        .eq("company_id", invitation.company_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMembership) {
        const { error: mUpdErr } = await adminClient
          .from("company_memberships")
          .update({
            is_active: true,
            role: invitation.role,
            department: invitation.department,
          })
          .eq("id", existingMembership.id);

        if (mUpdErr) {
          return new Response(JSON.stringify({ error: "Failed to activate membership" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        const { error: mInsErr } = await adminClient
          .from("company_memberships")
          .insert({
            user_id: user.id,
            company_id: invitation.company_id,
            role: invitation.role,
            department: invitation.department,
            is_active: true,
          });

        if (mInsErr) {
          return new Response(JSON.stringify({ error: "Failed to create membership" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Align user_roles (service key bypasses RLS; keeps app permissions consistent)
      await adminClient
        .from("user_roles")
        .upsert(
          { user_id: user.id, role: invitation.role, department: invitation.department },
          { onConflict: "user_id" },
        );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
