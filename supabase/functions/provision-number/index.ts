import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ProvisioningScope = "local" | "state" | "fallback";

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function getAuthClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
}

function getTwilioAuthHeader() {
  const accountSid = Deno.env.get("TWILIO_MASTER_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_MASTER_AUTH_TOKEN");
  if (!accountSid || !authToken) {
    throw new Error("Missing Twilio master credentials");
  }
  return {
    accountSid,
    authToken,
    authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
  };
}

function getAreaCode(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length >= 11) return digits.slice(1, 4);
  if (digits.length >= 10) return digits.slice(0, 3);
  return null;
}

async function lookupState(zipCode: string) {
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.places?.[0]?.["state abbreviation"] ?? null;
  } catch {
    return null;
  }
}

async function searchAvailableNumber(
  authorization: string,
  params: Record<string, string>,
): Promise<string | null> {
  const url = new URL("https://api.twilio.com/2010-04-01/Accounts");
  url.pathname += `/${Deno.env.get("TWILIO_MASTER_ACCOUNT_SID")}/AvailablePhoneNumbers/US/Local.json`;

  const searchParams = new URLSearchParams({ PageSize: "1", ...params });
  const response = await fetch(`${url.toString()}?${searchParams.toString()}`, {
    headers: { Authorization: authorization },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || "Failed to search available Twilio numbers");
  }

  const payload = await response.json();
  return payload?.available_phone_numbers?.[0]?.phone_number ?? null;
}

async function purchaseNumber(
  authorization: string,
  phoneNumber: string,
  friendlyName: string,
  webhookBaseUrl: string,
) {
  const params = new URLSearchParams({
    PhoneNumber: phoneNumber,
    FriendlyName: friendlyName,
    VoiceUrl: `${webhookBaseUrl}/twilio-voice-status?mode=answer`,
    VoiceMethod: "POST",
    StatusCallback: `${webhookBaseUrl}/twilio-voice-status`,
    StatusCallbackMethod: "POST",
    SmsUrl: `${webhookBaseUrl}/twilio-inbound-sms`,
    SmsMethod: "POST",
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get("TWILIO_MASTER_ACCOUNT_SID")}/IncomingPhoneNumbers.json`,
    {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to purchase Twilio number");
  }

  return payload;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authClient = getAuthClient(authHeader);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const { workspace_id } = await req.json();
    if (!workspace_id) {
      return new Response(JSON.stringify({ error: "Missing workspace_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getServiceClient();

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (!membership || membership.role !== "owner") {
      return new Response(JSON.stringify({ error: "Only workspace owners can provision numbers" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("name, business_zip, onboarding_config")
      .eq("id", workspace_id)
      .single();

    if (!workspace) {
      return new Response(JSON.stringify({ error: "Workspace not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingNumber } = await supabase
      .from("provisioned_numbers")
      .select("*")
      .eq("workspace_id", workspace_id)
      .maybeSingle();

    const { data: existingIntegration } = await supabase
      .from("integrations")
      .select("*")
      .eq("workspace_id", workspace_id)
      .eq("provider", "twilio")
      .maybeSingle();

    if (existingNumber) {
      const provisioningScope =
        (existingIntegration?.config as Record<string, unknown> | null)?.provisioning_scope ?? "fallback";
      return new Response(
        JSON.stringify({
          phone_number: existingNumber.phone_number,
          provisioned_number_id: existingNumber.id,
          status: existingIntegration?.status ?? existingNumber.status,
          provisioning_scope: provisioningScope,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const webhookBaseUrl = Deno.env.get("NEXAOS_WEBHOOK_BASE_URL");
    if (!webhookBaseUrl) {
      throw new Error("Missing NEXAOS_WEBHOOK_BASE_URL");
    }

    const { authorization } = getTwilioAuthHeader();
    let phoneNumber = null as string | null;
    let provisioningScope: ProvisioningScope = "fallback";

    if (workspace.business_zip) {
      phoneNumber = await searchAvailableNumber(authorization, { InPostalCode: workspace.business_zip });
      if (phoneNumber) {
        provisioningScope = "local";
      }
    }

    if (!phoneNumber && workspace.business_zip) {
      const state = await lookupState(workspace.business_zip);
      if (state) {
        phoneNumber = await searchAvailableNumber(authorization, { InRegion: state });
        if (phoneNumber) {
          provisioningScope = "state";
        }
      }
    }

    if (!phoneNumber) {
      phoneNumber = await searchAvailableNumber(authorization, {});
      provisioningScope = "fallback";
    }

    if (!phoneNumber) {
      throw new Error("No Twilio numbers available to provision");
    }

    const purchased = await purchaseNumber(
      authorization,
      phoneNumber,
      `${workspace.name} Recovery Line`,
      webhookBaseUrl,
    );

    const { data: insertedNumber, error: insertError } = await supabase
      .from("provisioned_numbers")
      .insert({
        workspace_id,
        phone_number: purchased.phone_number,
        twilio_sid: purchased.sid,
        friendly_name: purchased.friendly_name,
        area_code: getAreaCode(purchased.phone_number),
        status: "provisioned",
      })
      .select("*")
      .single();

    if (insertError) throw insertError;

    const mergedConfig = {
      ...((existingIntegration?.config as Record<string, unknown>) ?? {}),
      from_number: purchased.phone_number,
      twilio_number_sid: purchased.sid,
      provisioned_number_id: insertedNumber.id,
      provisioning_scope: provisioningScope,
    };

    if (existingIntegration) {
      const { error } = await supabase
        .from("integrations")
        .update({
          config: mergedConfig as Record<string, unknown>,
          status: "provisioned",
          connected_at: null,
        })
        .eq("id", existingIntegration.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("integrations")
        .insert({
          workspace_id,
          provider: "twilio",
          config: mergedConfig as Record<string, unknown>,
          status: "provisioned",
          connected_at: null,
        });
      if (error) throw error;
    }

    const rawOnboarding =
      workspace.onboarding_config &&
      typeof workspace.onboarding_config === "object" &&
      !Array.isArray(workspace.onboarding_config)
        ? workspace.onboarding_config
        : {};

    const rawChecklist =
      rawOnboarding.checklist &&
      typeof rawOnboarding.checklist === "object" &&
      !Array.isArray(rawOnboarding.checklist)
        ? rawOnboarding.checklist
        : {};

    const onboardingConfig = {
      ...rawOnboarding,
      provisioned_number_id: insertedNumber.id,
      provisioning_scope: provisioningScope,
      forwarding_pending: true,
      test_call_verified: false,
      test_call_verified_at: null,
      test_call_started_at: null,
      checklist: {
        ...rawChecklist,
        twilio_connected: false,
      },
    };

    const { error: onboardingError } = await supabase
      .from("workspaces")
      .update({ onboarding_config: onboardingConfig as Record<string, unknown> })
      .eq("id", workspace_id);

    if (onboardingError) throw onboardingError;

    return new Response(
      JSON.stringify({
        phone_number: insertedNumber.phone_number,
        provisioned_number_id: insertedNumber.id,
        status: "provisioned",
        provisioning_scope: provisioningScope,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("provision-number error:", error);
    return new Response(JSON.stringify({ error: error.message || "Provisioning failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
