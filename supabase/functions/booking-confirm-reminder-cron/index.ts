import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendSms(from: string, to: string, body: string) {
  const accountSid = Deno.env.get("TWILIO_MASTER_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_MASTER_AUTH_TOKEN");
  if (!accountSid || !authToken) {
    throw new Error("Missing Twilio master credentials");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: from, To: to, Body: body }),
  });
  const result = await resp.json();
  if (!resp.ok) throw new Error(result?.message || "Twilio send failed");
  return result;
}

async function logEvent(supabase: any, workspaceId: string, eventType: string, payload: any) {
  await supabase.from("workflow_logs").insert({ workspace_id: workspaceId, event_type: eventType, payload });
}

function formatRequestedWindowLabel(window: Record<string, any> | null | undefined) {
  if (!window) return "the requested service window";
  const dayLabel = String(window.day_label || "").trim();
  const label = String(window.label || "").trim();
  const rangeLabel = String(window.range_label || "").trim();

  if (dayLabel && label && rangeLabel) return `${dayLabel}, ${label} (${rangeLabel})`;
  if (dayLabel && label) return `${dayLabel}, ${label}`;
  return label || dayLabel || "the requested service window";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cronSecret = Deno.env.get("BOOKING_CONFIRM_REMINDER_CRON_SECRET");
  if (cronSecret) {
    const incoming = req.headers.get("x-cron-secret");
    if (incoming !== cronSecret) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    const { data: sessions, error } = await supabase
      .from("automation_sessions")
      .select("id, workspace_id, lead_id, answers, status, updated_at")
      .eq("type", "booking_confirm")
      .eq("status", "active")
      .limit(500);

    if (error) throw error;

    let remindersSent = 0;

    for (const session of sessions || []) {
      const answers = (session.answers as Record<string, any> | null) ?? {};
      const requestedAtValue = answers.requested_at || session.updated_at;
      const reminderSentAt = answers.reminder_sent_at ? Date.parse(String(answers.reminder_sent_at)) : 0;
      const requestedAt = requestedAtValue ? Date.parse(String(requestedAtValue)) : 0;

      if (!requestedAt || requestedAt > cutoff || reminderSentAt) {
        continue;
      }

      const requestedWindow =
        answers.requested_window && typeof answers.requested_window === "object"
          ? (answers.requested_window as Record<string, any>)
          : null;
      const customerName = String(answers.customer_name || "the customer");
      const windowSummary = formatRequestedWindowLabel(requestedWindow);

      const { data: integration } = await supabase
        .from("integrations")
        .select("config, status")
        .eq("workspace_id", session.workspace_id)
        .eq("provider", "twilio")
        .eq("status", "connected")
        .maybeSingle();

      const config =
        integration?.config && typeof integration.config === "object" && !Array.isArray(integration.config)
          ? (integration.config as Record<string, any>)
          : null;

      if (!config?.from_number || !config?.contractor_phone) {
        continue;
      }

      const reminderMessage = `Reminder: reply CONFIRM, CONFIRM 10AM, or CANCEL for ${customerName} (${windowSummary}).`;
      const result = await sendSms(config.from_number, config.contractor_phone, reminderMessage);

      await supabase
        .from("automation_sessions")
        .update({
          answers: {
            ...answers,
            reminder_sent_at: new Date().toISOString(),
            reminder_message_sid: result.sid,
          },
        })
        .eq("id", session.id);

      await logEvent(supabase, session.workspace_id, "booking_confirm_reminder_sent", {
        lead_id: session.lead_id,
        customer_name: customerName,
        requested_window: requestedWindow,
        message_sid: result.sid,
      });

      remindersSent += 1;
    }

    return new Response(JSON.stringify({ success: true, remindersSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
