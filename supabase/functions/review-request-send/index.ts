import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabaseAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
  if (userError || !userData?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const userId = userData.user.id;

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const { job_id, workspace_id } = await req.json();
    if (!job_id || !workspace_id) {
      return new Response(JSON.stringify({ error: "Missing job_id or workspace_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: membership } = await supabase.from("workspace_members").select("role").eq("workspace_id", workspace_id).eq("user_id", userId).eq("status", "active").single();
    if (!membership) {
      return new Response(JSON.stringify({ error: "Not a member" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: existing } = await supabase.from("review_requests").select("id").eq("job_id", job_id).limit(1);
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ success: true, review_request_id: existing[0].id, already_exists: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: job } = await supabase.from("jobs").select("*, leads!inner(id, phone, normalized_phone, name, location_id)").eq("id", job_id).single();
    if (!job) {
      return new Response(JSON.stringify({ error: "Job not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: ws } = await supabase.from("workspaces").select("name").eq("id", workspace_id).single();
    const { data: integration } = await supabase.from("integrations").select("config").eq("workspace_id", workspace_id).eq("provider", "twilio").eq("status", "connected").single();

    if (!integration) {
      return new Response(JSON.stringify({ error: "Twilio not configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const accountSid = Deno.env.get("TWILIO_MASTER_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_MASTER_AUTH_TOKEN");
    const cfg = integration.config as any;
    const leadPhone = job.leads.phone;
    if (!leadPhone || !accountSid || !authToken || !cfg.from_number) {
      return new Response(JSON.stringify({ error: "Missing phone or Twilio config" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const now = new Date().toISOString();
    const { data: rr, error: rrErr } = await supabase.from("review_requests").insert({
      workspace_id, job_id, status: "sent", outcome: "pending", sent_at: now, followup_count: 0,
    }).select("id").single();
    if (rrErr) throw rrErr;

    const msg = cfg.review_template || `How was your experience with ${ws?.name || "us"}? Reply 1-5.`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ From: cfg.from_number, To: leadPhone, Body: msg }),
    });
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.message || "Twilio send failed");

    await supabase.from("conversations").insert({
      workspace_id, lead_id: job.leads.id, channel: "sms", direction: "outbound", content: msg,
    });
    await supabase.from("workflow_logs").insert({
      workspace_id, event_type: "review_sms_sent", payload: { review_request_id: rr.id, job_id, lead_id: job.leads.id, message_sid: result.sid },
    });

    return new Response(JSON.stringify({ success: true, review_request_id: rr.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("review-request-send error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
