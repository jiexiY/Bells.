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
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invite_code, role, department } = await req.json();
    if (!invite_code || typeof invite_code !== "string") {
      return new Response(JSON.stringify({ error: "Invite code is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validRoles = ["team_lead", "member"];
    const selectedRole = validRoles.includes(role) ? role : "member";

    const validDepartments = ["tech", "marketing", "research"];
    const selectedDepartment = validDepartments.includes(department) ? department : null;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Look up company by invite code
    const { data: company, error: companyError } = await adminClient
      .from("companies")
      .select("id, name")
      .eq("invite_code", invite_code.toUpperCase().trim())
      .single();

    if (companyError || !company) {
      return new Response(JSON.stringify({ error: "Invalid invite code" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already a member
    const { data: existing } = await adminClient
      .from("company_memberships")
      .select("id, role, department, is_active")
      .eq("company_id", company.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      if (existing.is_active) {
        // User is already an active member - return success
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Already a member of this organization",
            company_name: company.name, 
            company_id: company.id,
            role: existing.role 
          }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Reactivate existing inactive membership
        const { error: reactivateError } = await adminClient
          .from("company_memberships")
          .update({ 
            is_active: true, 
            role: selectedRole, 
            department: selectedDepartment 
          })
          .eq("id", existing.id);

        if (reactivateError) {
          return new Response(JSON.stringify({ error: "Failed to reactivate membership" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Also update user_roles
        await adminClient
          .from("user_roles")
          .upsert({ user_id: user.id, role: selectedRole, department: selectedDepartment }, { onConflict: "user_id" });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Reactivated membership",
            company_name: company.name, 
            company_id: company.id,
            role: selectedRole 
          }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Add user as member with chosen role and department
    const { error: insertError } = await adminClient
      .from("company_memberships")
      .insert({
        company_id: company.id,
        user_id: user.id,
        role: selectedRole,
        department: selectedDepartment,
      });

    if (insertError) {
      return new Response(JSON.stringify({ error: "Failed to join organization" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also insert/update user_roles entry
    await adminClient
      .from("user_roles")
      .upsert({ user_id: user.id, role: selectedRole, department: selectedDepartment }, { onConflict: "user_id" });

    return new Response(
      JSON.stringify({ success: true, company_name: company.name, company_id: company.id, role: selectedRole }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
