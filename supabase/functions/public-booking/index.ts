import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return "";
}

function parseTimeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map((item) => parseInt(item, 10));
  return hour * 60 + minute;
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const values = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getTimeZoneParts(date, timeZone);
  const utcTime = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return utcTime - date.getTime();
}

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
) {
  const initialGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = getTimeZoneOffsetMs(new Date(initialGuess), timeZone);
  return new Date(initialGuess - offset);
}

function buildBookingSettings(config: Record<string, unknown>, fallbackTimezone: string | null) {
  const officeHours =
    config.office_hours && typeof config.office_hours === "object" && !Array.isArray(config.office_hours)
      ? (config.office_hours as Record<string, unknown>)
      : {};
  const bookingSettings =
    config.booking_settings && typeof config.booking_settings === "object" && !Array.isArray(config.booking_settings)
      ? (config.booking_settings as Record<string, unknown>)
      : {};

  return {
    duration_minutes: Number(bookingSettings.duration_minutes ?? 60) || 60,
    buffer_minutes: Number(bookingSettings.buffer_minutes ?? 15) || 15,
    timezone: String(bookingSettings.timezone ?? fallbackTimezone ?? "America/New_York"),
    start_time: String(bookingSettings.start_time ?? officeHours.start ?? "08:00"),
    end_time: String(bookingSettings.end_time ?? officeHours.end ?? "18:00"),
  };
}

function buildSlotGroups(settings: ReturnType<typeof buildBookingSettings>) {
  const groups: { day_label: string; date_value: string; slots: { label: string; value: string }[] }[] = [];
  const now = new Date();
  const currentParts = getTimeZoneParts(now, settings.timezone);
  const startMinutes = parseTimeToMinutes(settings.start_time);
  const endMinutes = parseTimeToMinutes(settings.end_time);
  const stepMinutes = settings.duration_minutes + settings.buffer_minutes;

  for (let offset = 0; offset < 10 && groups.length < 5; offset += 1) {
    const localDate = new Date(Date.UTC(currentParts.year, currentParts.month - 1, currentParts.day + offset));
    const year = localDate.getUTCFullYear();
    const month = localDate.getUTCMonth() + 1;
    const day = localDate.getUTCDate();
    const midday = zonedDateTimeToUtc(year, month, day, 12, 0, settings.timezone);
    const dayLabel = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      timeZone: settings.timezone,
    }).format(midday);

    const slots: { label: string; value: string }[] = [];
    for (let minute = startMinutes; minute + settings.duration_minutes <= endMinutes; minute += stepMinutes) {
      const slot = zonedDateTimeToUtc(year, month, day, Math.floor(minute / 60), minute % 60, settings.timezone);
      if (slot.getTime() <= now.getTime() + 5 * 60 * 1000) continue;

      slots.push({
        label: new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: settings.timezone,
        }).format(slot),
        value: slot.toISOString(),
      });
    }

    if (slots.length > 0) {
      groups.push({
        day_label: dayLabel,
        date_value: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        slots,
      });
    }
  }

  return groups;
}

async function resolveWorkspaceBooking(supabase: ReturnType<typeof getServiceClient>, slug: string) {
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, slug, industry, timezone")
    .eq("slug", slug)
    .single();

  if (workspaceError || !workspace) {
    throw new Error("Booking page not found.");
  }

  const { data: integration, error: integrationError } = await supabase
    .from("integrations")
    .select("config")
    .eq("workspace_id", workspace.id)
    .eq("provider", "twilio")
    .maybeSingle();

  if (integrationError) throw integrationError;

  const config =
    integration?.config && typeof integration.config === "object" && !Array.isArray(integration.config)
      ? (integration.config as Record<string, unknown>)
      : {};

  if (config.booking_mode !== "nexaos" || typeof config.booking_link !== "string" || !config.booking_link) {
    throw new Error("NexaOS booking is not enabled for this business.");
  }

  return {
    workspace,
    config,
    bookingSettings: buildBookingSettings(config, workspace.timezone),
  };
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

  const supabase = getServiceClient();

  try {
    const body = await req.json();
    const action = String(body?.action || "");
    const slug = String(body?.slug || "").trim();

    if (!slug) {
      return new Response(JSON.stringify({ error: "Missing booking page slug." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { workspace, config, bookingSettings } = await resolveWorkspaceBooking(supabase, slug);
    const slotGroups = buildSlotGroups(bookingSettings);

    if (action === "load") {
      return new Response(
        JSON.stringify({
          workspace_name: workspace.name,
          workspace_slug: workspace.slug,
          industry: workspace.industry,
          booking_link: config.booking_link,
          booking_settings: bookingSettings,
          slot_groups: slotGroups,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action !== "create") {
      return new Response(JSON.stringify({ error: "Unknown action." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerName = String(body?.customer_name || "").trim();
    const customerPhone = normalizePhone(String(body?.customer_phone || ""));
    const scheduledAt = String(body?.scheduled_at || "");

    if (!customerName) {
      return new Response(JSON.stringify({ error: "Missing customer name." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!customerPhone) {
      return new Response(JSON.stringify({ error: "Missing customer phone." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedSlots = new Set(slotGroups.flatMap((group) => group.slots.map((slot) => slot.value)));
    if (!allowedSlots.has(scheduledAt)) {
      return new Response(JSON.stringify({ error: "That booking time is no longer available. Refresh and pick another slot." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("normalized_phone", customerPhone)
      .maybeSingle();

    let leadId = existingLead?.id || "";

    if (leadId) {
      const { error: updateLeadError } = await supabase
        .from("leads")
        .update({
          name: customerName,
          phone: customerPhone,
          normalized_phone: customerPhone,
          status: "qualified",
        })
        .eq("id", leadId);
      if (updateLeadError) throw updateLeadError;
    } else {
      const { data: insertedLead, error: insertLeadError } = await supabase
        .from("leads")
        .insert({
          workspace_id: workspace.id,
          name: customerName,
          phone: customerPhone,
          normalized_phone: customerPhone,
          source: "booking",
          status: "qualified",
        })
        .select("id")
        .single();
      if (insertLeadError) throw insertLeadError;
      leadId = insertedLead.id;
    }

    const { data: firstStage } = await supabase
      .from("pipeline_stages")
      .select("id")
      .eq("workspace_id", workspace.id)
      .order("position")
      .limit(1)
      .maybeSingle();

    const { data: existingJob } = await supabase
      .from("jobs")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("lead_id", leadId)
      .in("status", ["scheduled", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let jobId = existingJob?.id || "";

    if (jobId) {
      const { error: updateJobError } = await supabase
        .from("jobs")
        .update({
          status: "scheduled",
          scheduled_at: scheduledAt,
          stage_id: firstStage?.id ?? null,
        })
        .eq("id", jobId);
      if (updateJobError) throw updateJobError;
    } else {
      const { data: insertedJob, error: insertJobError } = await supabase
        .from("jobs")
        .insert({
          workspace_id: workspace.id,
          lead_id: leadId,
          stage_id: firstStage?.id ?? null,
          status: "scheduled",
          scheduled_at: scheduledAt,
        })
        .select("id")
        .single();
      if (insertJobError) throw insertJobError;
      jobId = insertedJob.id;
    }

    await supabase.from("workflow_logs").insert({
      workspace_id: workspace.id,
      event_type: "public_booking_created",
      payload: {
        lead_id: leadId,
        job_id: jobId,
        customer_name: customerName,
        customer_phone: customerPhone,
        scheduled_at: scheduledAt,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        workspace_name: workspace.name,
        scheduled_at: scheduledAt,
        lead_id: leadId,
        job_id: jobId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("public-booking error:", error);
    return new Response(JSON.stringify({ error: error.message || "Booking failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
