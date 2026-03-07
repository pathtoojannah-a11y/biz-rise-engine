import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>,
): Promise<boolean> {
  const sortedKeys = Object.keys(params).sort();
  let dataStr = url;
  for (const key of sortedKeys) dataStr += key + params[key];
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(dataStr));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === signature;
}

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function getTwilioMasterAccountSid() {
  return Deno.env.get("TWILIO_MASTER_ACCOUNT_SID") || "";
}

function getTwilioMasterAuthToken() {
  return Deno.env.get("TWILIO_MASTER_AUTH_TOKEN") || "";
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

async function resolveWorkspace(supabase: any, toNumber: string) {
  const normalized = toNumber.replace(/\D/g, "");
  const variants = [toNumber, `+${normalized}`, `+1${normalized}`, normalized];
  const { data: integrations } = await supabase
    .from("integrations")
    .select("workspace_id, config, status")
    .eq("provider", "twilio")
    .in("status", ["provisioned", "connected"]);
  if (!integrations) return null;
  for (const integration of integrations) {
    const config = integration.config as any;
    const configNumber = config?.from_number?.replace(/\D/g, "");
    if (!configNumber) continue;
    if (
      variants.includes(config.from_number) ||
      variants.includes(configNumber) ||
      normalized === configNumber ||
      normalized.endsWith(configNumber) ||
      configNumber.endsWith(normalized)
    ) {
      return { workspace_id: integration.workspace_id, config };
    }
  }
  return null;
}

async function logEvent(supabase: any, workspaceId: string, eventType: string, payload: Record<string, any>) {
  await supabase.from("workflow_logs").insert({ workspace_id: workspaceId, event_type: eventType, payload });
}

async function upsertLeadByPhone(supabase: any, workspaceId: string, phone: string, callerName?: string) {
  const normalized = normalizePhone(phone);
  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("normalized_phone", normalized)
    .limit(1);
  if (existing && existing.length > 0) return existing[0];

  const { data: newLead, error } = await supabase
    .from("leads")
    .insert({
      workspace_id: workspaceId,
      name: callerName || phone,
      phone,
      normalized_phone: normalized,
      source: "phone",
      status: "new",
    })
    .select("id")
    .single();

  if (error) throw error;
  return newLead;
}

async function sendSms(from: string, to: string, body: string) {
  const accountSid = getTwilioMasterAccountSid();
  const authToken = getTwilioMasterAuthToken();
  if (!accountSid || !authToken) throw new Error("Missing Twilio master credentials");

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
  if (!resp.ok) throw new Error(result.message || "Twilio send failed");
  return result;
}

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

  const mode = new URL(req.url).searchParams.get("mode");
  const respondWithInfoMessage = mode === "answer" || mode === "missed";
  const forceMissed = mode === "answer" || mode === "missed";
  const supabase = getServiceClient();

  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const callSid = params.CallSid;
    const calledNumber = params.Called || params.To || "";
    const callerNumber = params.Caller || params.From || "";
    const callerName = params.CallerName || "";
    const duration = parseInt(params.CallDuration || params.Duration || "0", 10);
    const rawStatus = params.DialCallStatus || params.CallStatus || "";
    const callStatus = forceMissed ? "no-answer" : rawStatus;

    const workspaceMatch = await resolveWorkspace(supabase, calledNumber);
    if (!workspaceMatch) {
      await logEvent(supabase, "00000000-0000-0000-0000-000000000000", "webhook_rejected", {
        reason: "unknown_number",
        called: calledNumber,
      });
      return new Response(
        respondWithInfoMessage
          ? "<Response><Say voice=\"alice\">Thanks for calling. We will text you right back.</Say><Hangup/></Response>"
          : "<Response/>",
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } },
      );
    }

    const { workspace_id, config } = workspaceMatch;
    const twilioSignature = req.headers.get("X-Twilio-Signature") || "";
    const twilioAuthToken = getTwilioMasterAuthToken();
    if (twilioAuthToken && twilioSignature) {
      const valid = await validateTwilioSignature(twilioAuthToken, twilioSignature, req.url, params);
      if (!valid) {
        await logEvent(supabase, workspace_id, "webhook_rejected", {
          reason: "invalid_signature",
          call_sid: callSid,
        });
        return new Response("<Response/>", { status: 403, headers: { ...corsHeaders, "Content-Type": "text/xml" } });
      }
    } else if (twilioAuthToken && !twilioSignature) {
      await logEvent(supabase, workspace_id, "webhook_rejected", {
        reason: "missing_signature",
        call_sid: callSid,
      });
      return new Response("<Response/>", { status: 403, headers: { ...corsHeaders, "Content-Type": "text/xml" } });
    }

    await logEvent(supabase, workspace_id, "call_received", {
      call_sid: callSid,
      status: callStatus,
      from: callerNumber,
      to: calledNumber,
      duration,
      mode,
    });

    if (callSid) {
      const { data: existingCall } = await supabase
        .from("calls")
        .select("id")
        .eq("twilio_sid", callSid)
        .limit(1);
      if (existingCall && existingCall.length > 0) {
        return new Response(
          respondWithInfoMessage
            ? "<Response><Say voice=\"alice\">Thanks for calling. We will text you right back.</Say><Hangup/></Response>"
            : "<Response/>",
          { headers: { ...corsHeaders, "Content-Type": "text/xml" } },
        );
      }
    }

    const lead = await upsertLeadByPhone(supabase, workspace_id, callerNumber, callerName);
    await logEvent(supabase, workspace_id, "lead_upserted", { lead_id: lead.id, phone: callerNumber });

    const missedStatuses = ["no-answer", "busy", "failed", "canceled", "voicemail"];
    const isMissed = missedStatuses.includes(callStatus);
    const callStatusEnum = isMissed ? "missed" : callStatus === "voicemail" ? "voicemail" : "answered";

    await supabase.from("calls").insert({
      workspace_id,
      lead_id: lead.id,
      direction: "inbound",
      status: callStatusEnum,
      duration: duration || 0,
      twilio_sid: callSid,
    });

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("name, onboarding_config")
      .eq("id", workspace_id)
      .single();

    const onboardingConfig =
      workspace?.onboarding_config &&
      typeof workspace.onboarding_config === "object" &&
      !Array.isArray(workspace.onboarding_config)
        ? workspace.onboarding_config
        : {};
    const checklist =
      onboardingConfig.checklist &&
      typeof onboardingConfig.checklist === "object" &&
      !Array.isArray(onboardingConfig.checklist)
        ? onboardingConfig.checklist
        : {};

    if (!onboardingConfig.test_call_verified && onboardingConfig.test_call_started_at && isMissed) {
      await supabase
        .from("workspaces")
        .update({
          onboarding_config: {
            ...onboardingConfig,
            forwarding_pending: false,
            test_call_verified: true,
            test_call_verified_at: new Date().toISOString(),
            checklist: {
              ...checklist,
              twilio_connected: true,
            },
          } as any,
        })
        .eq("id", workspace_id);

      await supabase
        .from("integrations")
        .update({ status: "connected", connected_at: new Date().toISOString() })
        .eq("workspace_id", workspace_id)
        .eq("provider", "twilio");

      await supabase
        .from("provisioned_numbers")
        .update({ status: "active" })
        .eq("workspace_id", workspace_id);

      await logEvent(supabase, workspace_id, "forwarding_test_verified", {
        call_sid: callSid,
        lead_id: lead.id,
        phone_path: config.phone_path ?? "B",
      });
    }

    if (isMissed && config.from_number) {
      const optedOut = await isOptedOut(supabase, workspace_id, lead.id);
      if (optedOut) {
        await logEvent(supabase, workspace_id, "sms_blocked_opt_out", { lead_id: lead.id });
      } else {
        const template =
          config.missed_call_template ||
          `Sorry we missed your call to ${workspace?.name || "us"}. What service do you need help with?`;

        try {
          const smsResult = await sendSms(config.from_number, callerNumber, template);
          await supabase.from("conversations").insert({
            workspace_id,
            lead_id: lead.id,
            channel: "sms",
            direction: "outbound",
            content: template,
          });
          await supabase.from("automation_sessions").upsert({
            workspace_id,
            lead_id: lead.id,
            type: "qualification",
            current_step: "step_1_service_type",
            answers: {},
            status: "active",
            last_message_sid: smsResult.sid,
          }, { onConflict: "workspace_id,lead_id,type" });
          await logEvent(supabase, workspace_id, "sms_sent", {
            lead_id: lead.id,
            to: callerNumber,
            message_sid: smsResult.sid,
            template: "missed_call",
            phone_path: config.phone_path ?? "B",
          });
        } catch (smsError: any) {
          await logEvent(supabase, workspace_id, "error", {
            step: "missed_call_sms",
            lead_id: lead.id,
            error: smsError.message,
          });
        }
      }
    }

    return new Response(
      respondWithInfoMessage
        ? "<Response><Say voice=\"alice\">Thanks for calling. We will text you right back.</Say><Hangup/></Response>"
        : "<Response/>",
      { headers: { ...corsHeaders, "Content-Type": "text/xml" } },
    );
  } catch (error: any) {
    console.error("voice-status error:", error);
    return new Response("<Response/>", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/xml" } });
  }
});
