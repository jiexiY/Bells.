import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, companyName, inviterName, role } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [email],
        subject: `You've been invited to join ${companyName || "a team"}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a;">You're Invited! 🎉</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              ${inviterName ? `<strong>${inviterName}</strong> has` : "You've been"} invited you to join 
              <strong>${companyName || "the organization"}</strong> as a <strong>${role || "member"}</strong>.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Sign in to your account to accept the invitation and get started.
            </p>
            <div style="margin: 30px 0;">
              <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "#"}" 
                 style="background-color: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 16px;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #999; font-size: 14px;">
              If you don't have an account yet, you'll need to sign up first using this email address.
            </p>
          </div>
        `,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error(`Resend API error: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending invite email:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
