import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Twilio signature validation (HMAC-SHA1)
async function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): Promise<boolean> {
  const sortedKeys = Object.keys(params).sort();
  let dataStr = url;
  for (const key of sortedKeys) {
    dataStr += key + params[key];
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(dataStr));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === signature;
}

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function resolveWorkspace(supabase: any, toNumber: string) {
  const normalized = toNumber.replace(/\D/g, "");
  const variants = [toNumber, `+${normalized}`, `+1${normalized}`, normalized];
  const { data: integrations } = await supabase
    .from("integrations")
    .select("workspace_id, config")
    .eq("provider", "twilio")
    .eq("status", "connected");
  if (!integrations) return null;
  for (const int of integrations) {
    const cfg = int.config as any;
    if (!cfg?.from_number) continue;
    const cfgNorm = cfg.from_number.replace(/\D/g, "");
    if (variants.includes(cfg.from_number) || variants.includes(cfgNorm) || normalized === cfgNorm || normalized.endsWith(cfgNorm) || cfgNorm.endsWith(normalized)) {
      return { workspace_id: int.workspace_id, config: cfg };
    }
  }
  return null;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return "+" + digits;
}

async function logEvent(supabase: any, workspaceId: string, eventType: string, payload: Record<string, any>) {
  await supabase.from("workflow_logs").insert({ workspace_id: workspaceId, event_type: eventType, payload });
}

async function upsertLeadByPhone(supabase: any, workspaceId: string, phone: string, callerName?: string) {
  const normalized = normalizePhone(phone);
  const { data: existing } = await supabase
    .from("leads").select("id").eq("workspace_id", workspaceId).eq("normalized_phone", normalized).limit(1);
  if (existing && existing.length > 0) return existing[0];
  const { data: newLead, error } = await supabase
    .from("leads")
    .insert({ workspace_id: workspaceId, name: callerName || phone, phone, normalized_phone: normalized, source: "phone", status: "new" })
    .select("id").single();
  if (error) throw error;
  return newLead;
}

async function sendSms(accountSid: string, authToken: string, from: string, to: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: from, To: to, Body: body }),
  });
  const result = await resp.json();
  if (!resp.ok) throw new Error(result.message || "Twilio send failed");
  return result;
}

// Check if lead has opted out
async function isOptedOut(supabase: any, workspaceId: string, leadId: string): Promise<boolean> {
  const { data } = await supabase
    .from("automation_sessions")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("lead_id", leadId)
    .eq("status", "opted_out")
    .limit(1);
  return !!(data && data.length > 0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const supabase = getServiceClient();

  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((val, key) => { params[key] = val.toString(); });

    const callStatus = params.CallStatus;
    const callSid = params.CallSid;
    const calledNumber = params.Called || params.To || "";
    const callerNumber = params.Caller || params.From || "";
    const duration = parseInt(params.CallDuration || params.Duration || "0", 10);
    const callerName = params.CallerName || "";

    // Resolve workspace FIRST (needed for signature validation)
    const ws = await resolveWorkspace(supabase, calledNumber);
    if (!ws) {
      console.log("Unknown number:", calledNumber);
      // Log to a nil workspace for observability
      await logEvent(supabase, "00000000-0000-0000-0000-000000000000", "webhook_rejected", {
        reason: "unknown_number", called: calledNumber,
      });
      return new Response("<Response/>", { headers: { ...corsHeaders, "Content-Type": "text/xml" } });
    }

    const { workspace_id, config } = ws;

    // ===== TWILIO SIGNATURE VALIDATION =====
    const twilioSignature = req.headers.get("X-Twilio-Signature") || "";
    if (config.auth_token && twilioSignature) {
      const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/twilio-voice-status`;
      const valid = await validateTwilioSignature(config.auth_token, twilioSignature, webhookUrl, params);
      if (!valid) {
        await logEvent(supabase, workspace_id, "webhook_rejected", {
          reason: "invalid_signature", call_sid: callSid,
        });
        return new Response("<Response/>", { status: 403, headers: { ...corsHeaders, "Content-Type": "text/xml" } });
      }
    } else if (config.auth_token && !twilioSignature) {
      // Signature header missing — reject in production
      await logEvent(supabase, workspace_id, "webhook_rejected", {
        reason: "missing_signature", call_sid: callSid,
      });
      return new Response("<Response/>", { status: 403, headers: { ...corsHeaders, "Content-Type": "text/xml" } });
    }

    await logEvent(supabase, workspace_id, "call_received", {
      call_sid: callSid, status: callStatus, from: callerNumber, to: calledNumber, duration,
    });

    // Dedupe by twilio_sid — idempotent on retries
    if (callSid) {
      const { data: existingCall } = await supabase
        .from("calls").select("id").eq("twilio_sid", callSid).limit(1);
      if (existingCall && existingCall.length > 0) {
        return new Response("<Response/>", { headers: { ...corsHeaders, "Content-Type": "text/xml" } });
      }
    }

    // Upsert lead
    const lead = await upsertLeadByPhone(supabase, workspace_id, callerNumber, callerName);
    await logEvent(supabase, workspace_id, "lead_upserted", { lead_id: lead.id, phone: callerNumber });

    // Create call record
    const isMissed = ["no-answer", "busy", "failed", "canceled"].includes(callStatus);
    const callStatusEnum = isMissed ? "missed" : callStatus === "voicemail" ? "voicemail" : "answered";

    await supabase.from("calls").insert({
      workspace_id, lead_id: lead.id, direction: "inbound",
      status: callStatusEnum, duration: duration || 0, twilio_sid: callSid,
    });

    // Missed call automation
    if (isMissed || callStatus === "voicemail") {
      const automationEnabled = config.missed_call_sms !== false;

      if (automationEnabled && config.account_sid && config.auth_token && config.from_number) {
        // Check opt-out before sending
        const optedOut = await isOptedOut(supabase, workspace_id, lead.id);
        if (optedOut) {
          await logEvent(supabase, workspace_id, "sms_blocked_opt_out", { lead_id: lead.id });
          return new Response("<Response/>", { headers: { ...corsHeaders, "Content-Type": "text/xml" } });
        }

        const { data: workspace } = await supabase
          .from("workspaces").select("name").eq("id", workspace_id).single();

        const template = config.missed_call_template ||
          `Sorry we missed your call to ${workspace?.name || "us"}. What service do you need help with?`;

        try {
          const smsResult = await sendSms(config.account_sid, config.auth_token, config.from_number, callerNumber, template);

          await supabase.from("conversations").insert({
            workspace_id, lead_id: lead.id, channel: "sms", direction: "outbound", content: template,
          });

          await supabase.from("automation_sessions").upsert({
            workspace_id, lead_id: lead.id, type: "qualification",
            current_step: "step_1_service_type", answers: {}, status: "active",
            last_message_sid: smsResult.sid,
          }, { onConflict: "workspace_id,lead_id,type" });

          await logEvent(supabase, workspace_id, "sms_sent", {
            lead_id: lead.id, to: callerNumber, message_sid: smsResult.sid, template: "missed_call",
          });
        } catch (smsErr: any) {
          await logEvent(supabase, workspace_id, "error", {
            step: "missed_call_sms", lead_id: lead.id, error: smsErr.message,
          });
        }
      }
    }

    return new Response("<Response/>", { headers: { ...corsHeaders, "Content-Type": "text/xml" } });
  } catch (err: any) {
    console.error("voice-status error:", err);
    return new Response("<Response/>", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml" } });
  }
});
