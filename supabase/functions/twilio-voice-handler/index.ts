import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  return btoa(String.fromCharCode(...new Uint8Array(sig))) === signature;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function getTwilioMasterAuthToken() {
  return Deno.env.get("TWILIO_MASTER_AUTH_TOKEN") || "";
}

function withinOfficeHours(config: any, timezone: string | null): boolean {
  if (!config?.office_hours) return true;
  const officeHours = config.office_hours as { enabled?: boolean; start?: string; end?: string };
  if (!officeHours.enabled || !officeHours.start || !officeHours.end) return true;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone || "UTC",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  const [hour, minute] = formatter.format(new Date()).split(":").map((value) => parseInt(value, 10));
  const nowMinutes = hour * 60 + minute;
  const [startHour, startMinute] = officeHours.start.split(":").map((value) => parseInt(value, 10));
  const [endHour, endMinute] = officeHours.end.split(":").map((value) => parseInt(value, 10));

  return nowMinutes >= startHour * 60 + startMinute && nowMinutes <= endHour * 60 + endMinute;
}

async function resolveWorkspace(supabase: any, toNumber: string) {
  const normalized = toNumber.replace(/\D/g, "");
  const { data: integrations } = await supabase
    .from("integrations")
    .select("workspace_id, config, status")
    .eq("provider", "twilio")
    .in("status", ["provisioned", "connected"]);
  if (!integrations) return null;

  for (const integration of integrations) {
    const config = integration.config as any;
    const fromNumber = config?.from_number?.replace(/\D/g, "");
    if (!fromNumber) continue;
    if (normalized === fromNumber || normalized.endsWith(fromNumber) || fromNumber.endsWith(normalized)) {
      return { workspace_id: integration.workspace_id, config };
    }
  }

  return null;
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
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const calledNumber = params.To || params.Called || "";
    const twilioSignature = req.headers.get("X-Twilio-Signature") || "";
    const twilioAuthToken = getTwilioMasterAuthToken();

    if (twilioAuthToken && twilioSignature) {
      const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/twilio-voice-handler`;
      const valid = await validateTwilioSignature(twilioAuthToken, twilioSignature, webhookUrl, params);
      if (!valid) {
        return new Response("<Response><Say>Unauthorized.</Say><Hangup/></Response>", {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "text/xml" },
        });
      }
    }

    const workspaceMatch = await resolveWorkspace(supabase, calledNumber);
    if (!workspaceMatch) {
      return new Response("<Response><Say>Number not configured.</Say><Hangup/></Response>", {
        headers: { ...corsHeaders, "Content-Type": "text/xml" },
      });
    }

    const { workspace_id, config } = workspaceMatch;
    const contractorPhone = normalizePhone(config.contractor_phone || "");
    const baseUrl = Deno.env.get("NEXAOS_WEBHOOK_BASE_URL") || `${Deno.env.get("SUPABASE_URL")}/functions/v1`;

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("timezone")
      .eq("id", workspace_id)
      .single();

    if (!contractorPhone || !withinOfficeHours(config, workspace?.timezone || null)) {
      return new Response(
        `<Response><Redirect method="POST">${baseUrl}/twilio-voice-status?mode=missed</Redirect></Response>`,
        { headers: { ...corsHeaders, "Content-Type": "text/xml" } },
      );
    }

    return new Response(
      `<Response><Dial callerId="${normalizePhone(config.from_number || calledNumber)}" timeout="25" action="${baseUrl}/twilio-voice-status?mode=dial-result" method="POST"><Number>${contractorPhone}</Number></Dial></Response>`,
      { headers: { ...corsHeaders, "Content-Type": "text/xml" } },
    );
  } catch (error: any) {
    console.error("twilio-voice-handler error:", error);
    return new Response("<Response><Say>We will text you right back.</Say><Hangup/></Response>", {
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });
  }
});
