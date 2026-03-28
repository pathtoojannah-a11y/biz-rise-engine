import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  buildWindowOccupancyMap,
  filterWindowGroupsByCapacity,
} from "../../../src/lib/booking-flow.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type WorkDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type BookingSettings = {
  timezone: string;
  start_time: string;
  end_time: string;
  work_days: WorkDay[];
  jobs_per_day: number;
};

type BookingWindow = {
  key: string;
  label: string;
  range_label: string;
  value: string;
  scheduled_at: string;
};

type BookingWindowGroup = {
  day_label: string;
  date_value: string;
  windows: BookingWindow[];
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

function formatMinutes(minutes: number) {
  const normalized = Math.max(0, Math.min(minutes, 24 * 60));
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  if (minute === 0) return `${hour12}${suffix.toLowerCase()}`;
  return `${hour12}:${String(minute).padStart(2, "0")}${suffix.toLowerCase()}`;
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
    weekday: "short",
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
    weekday: String(values.weekday || "").toLowerCase(),
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

function normalizeWorkDays(value: unknown): WorkDay[] {
  if (!Array.isArray(value)) return ["mon", "tue", "wed", "thu", "fri"];

  const validDays = value.filter((item): item is WorkDay =>
    typeof item === "string" && ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].includes(item),
  );

  return validDays.length > 0 ? validDays : ["mon", "tue", "wed", "thu", "fri"];
}

function buildBookingSettings(config: Record<string, unknown>, fallbackTimezone: string | null): BookingSettings {
  const officeHours =
    config.office_hours && typeof config.office_hours === "object" && !Array.isArray(config.office_hours)
      ? (config.office_hours as Record<string, unknown>)
      : {};
  const bookingSettings =
    config.booking_settings && typeof config.booking_settings === "object" && !Array.isArray(config.booking_settings)
      ? (config.booking_settings as Record<string, unknown>)
      : {};

  const timezone = String(bookingSettings.timezone ?? fallbackTimezone ?? "America/New_York");
  const start_time = String(bookingSettings.start_time ?? officeHours.start ?? "08:00");
  const end_time = String(bookingSettings.end_time ?? officeHours.end ?? "17:00");
  const jobs_per_day = Math.max(1, Math.min(5, Number(bookingSettings.jobs_per_day ?? 3) || 3));
  const work_days = normalizeWorkDays(bookingSettings.work_days);

  return {
    timezone,
    start_time,
    end_time,
    work_days,
    jobs_per_day,
  };
}

function getWindowLabels(count: number) {
  if (count <= 1) return ["Daytime"];
  if (count === 2) return ["Morning", "Afternoon"];
  if (count === 3) return ["Morning", "Midday", "Afternoon"];
  if (count === 4) return ["Early morning", "Late morning", "Early afternoon", "Late afternoon"];
  return ["Early morning", "Late morning", "Midday", "Early afternoon", "Late afternoon"];
}

function buildWindowsForDay(
  year: number,
  month: number,
  day: number,
  settings: BookingSettings,
): BookingWindow[] {
  const startMinutes = parseTimeToMinutes(settings.start_time);
  const endMinutes = parseTimeToMinutes(settings.end_time);
  const totalMinutes = endMinutes - startMinutes;

  if (totalMinutes <= 0) return [];

  const labels = getWindowLabels(settings.jobs_per_day);
  const size = totalMinutes / labels.length;

  return labels.map((label, index) => {
    const windowStart = Math.round(startMinutes + size * index);
    const windowEnd = index === labels.length - 1
      ? endMinutes
      : Math.round(startMinutes + size * (index + 1));
    const scheduledAt = zonedDateTimeToUtc(
      year,
      month,
      day,
      Math.floor(windowStart / 60),
      windowStart % 60,
      settings.timezone,
    );

    return {
      key: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      range_label: `${formatMinutes(windowStart)} - ${formatMinutes(windowEnd)}`,
      value: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}:${label
        .toLowerCase()
        .replace(/\s+/g, "-")}`,
      scheduled_at: scheduledAt.toISOString(),
    };
  });
}

function buildWindowGroups(settings: BookingSettings): BookingWindowGroup[] {
  const groups: BookingWindowGroup[] = [];
  const now = new Date();
  const currentParts = getTimeZoneParts(now, settings.timezone);

  for (let offset = 0; offset < 14 && groups.length < 5; offset += 1) {
    const localDate = new Date(Date.UTC(currentParts.year, currentParts.month - 1, currentParts.day + offset));
    const year = localDate.getUTCFullYear();
    const month = localDate.getUTCMonth() + 1;
    const day = localDate.getUTCDate();
    const midday = zonedDateTimeToUtc(year, month, day, 12, 0, settings.timezone);
    const parts = getTimeZoneParts(midday, settings.timezone);
    const weekdayKey = parts.weekday.slice(0, 3) as WorkDay;

    if (!settings.work_days.includes(weekdayKey)) continue;

    const dayLabel = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      timeZone: settings.timezone,
    }).format(midday);

    const windows = buildWindowsForDay(year, month, day, settings).filter((window) => {
      return new Date(window.scheduled_at).getTime() > now.getTime() + 5 * 60 * 1000;
    });

    if (windows.length === 0) continue;

    groups.push({
      day_label: dayLabel,
      date_value: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      windows,
    });
  }

  return groups;
}

function normalizeServiceType(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  return normalized
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function sendSms(from: string, to: string, body: string) {
  const accountSid = Deno.env.get("TWILIO_MASTER_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_MASTER_AUTH_TOKEN");
  if (!accountSid || !authToken) return;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: from, To: to, Body: body }),
  });
}

async function loadWindowOccupancy(
  supabase: ReturnType<typeof getServiceClient>,
  workspaceId: string,
  scheduledAts: string[],
) {
  if (scheduledAts.length === 0) {
    return {};
  }

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("scheduled_at")
    .eq("workspace_id", workspaceId)
    .in("status", ["pending_confirmation", "scheduled"])
    .in("scheduled_at", scheduledAts);

  if (error) throw error;

  return buildWindowOccupancyMap(
    (jobs || [])
      .map((job) => String(job.scheduled_at || ""))
      .filter(Boolean),
  );
}

function getRequestedWindowSummary(group: BookingWindowGroup, window: BookingWindow) {
  return `${group.day_label}, ${window.label} (${window.range_label})`;
}

function getPendingCustomerMessage(customerName: string, businessName: string, windowSummary: string) {
  return `Thanks ${customerName}! We got your request for ${windowSummary}. ${businessName} will confirm the exact arrival time shortly.`;
}

function getContractorBookingPrompt(
  customerName: string,
  customerPhone: string,
  windowSummary: string,
  serviceType: string,
) {
  const servicePrefix = serviceType ? `${serviceType} | ` : "";
  return `New booking request: ${servicePrefix}${customerName}\n${windowSummary}\n${customerPhone}\nReply CONFIRM, CONFIRM 10AM, or CANCEL.`;
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
    const baseWindowGroups = buildWindowGroups(bookingSettings);
    const occupancy = await loadWindowOccupancy(
      supabase,
      workspace.id,
      baseWindowGroups.flatMap((group) => group.windows.map((window) => window.scheduled_at)),
    );
    const windowGroups = filterWindowGroupsByCapacity(baseWindowGroups, occupancy, 1);

    if (action === "load") {
      return new Response(
        JSON.stringify({
          workspace_name: workspace.name,
          workspace_slug: workspace.slug,
          industry: workspace.industry,
          booking_link: config.booking_link,
          booking_settings: bookingSettings,
          window_groups: windowGroups,
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
    const selectedWindowValue = String(body?.window_value || "");
    const serviceType = normalizeServiceType(String(body?.service_type || ""));

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

    const matchedGroup = windowGroups.find((group) =>
      group.windows.some((window) => window.value === selectedWindowValue)
    );
    const matchedWindow = matchedGroup?.windows.find((window) => window.value === selectedWindowValue);

    if (!matchedGroup || !matchedWindow) {
      return new Response(JSON.stringify({ error: "That service window is no longer available. Refresh and pick another one." }), {
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

    const { count: existingWindowCount, error: existingWindowError } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .eq("scheduled_at", matchedWindow.scheduled_at)
      .in("status", ["pending_confirmation", "scheduled"]);

    if (existingWindowError) throw existingWindowError;

    if ((existingWindowCount || 0) >= 1) {
      return new Response(JSON.stringify({ error: "That service window was just taken. Refresh and pick another one." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingJob } = await supabase
      .from("jobs")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("lead_id", leadId)
      .in("status", ["pending_confirmation", "scheduled", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let jobId = existingJob?.id || "";

    if (jobId) {
      const { error: updateJobError } = await supabase
        .from("jobs")
        .update({
          status: "pending_confirmation",
          scheduled_at: matchedWindow.scheduled_at,
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
          status: "pending_confirmation",
          scheduled_at: matchedWindow.scheduled_at,
        })
        .select("id")
        .single();
      if (insertJobError) throw insertJobError;
      jobId = insertedJob.id;
    }

    const windowSummary = getRequestedWindowSummary(matchedGroup, matchedWindow);

    await supabase.from("workflow_logs").insert({
      workspace_id: workspace.id,
      event_type: "public_booking_created",
      payload: {
        lead_id: leadId,
        job_id: jobId,
        customer_name: customerName,
        customer_phone: customerPhone,
        service_type: serviceType || null,
        requested_window: {
          day_label: matchedGroup.day_label,
          label: matchedWindow.label,
          range_label: matchedWindow.range_label,
          value: matchedWindow.value,
        },
        scheduled_at: matchedWindow.scheduled_at,
      },
    });

    let contractorMessageSid: string | null = null;

    if (typeof config.from_number === "string" && typeof config.contractor_phone === "string") {
      const contractorSms = await sendSms(
        config.from_number,
        config.contractor_phone,
        getContractorBookingPrompt(customerName, customerPhone, windowSummary, serviceType),
      );
      contractorMessageSid = contractorSms?.sid || null;
    }

    await supabase.from("automation_sessions").upsert(
      {
        workspace_id: workspace.id,
        lead_id: leadId,
        type: "booking_confirm",
        status: "active",
        current_step: "awaiting_confirmation",
        last_message_sid: contractorMessageSid,
        answers: {
          job_id: jobId,
          customer_name: customerName,
          customer_phone: customerPhone,
          service_type: serviceType || null,
          requested_window: {
            day_label: matchedGroup.day_label,
            label: matchedWindow.label,
            range_label: matchedWindow.range_label,
            value: matchedWindow.value,
            scheduled_at: matchedWindow.scheduled_at,
          },
          reminder_sent_at: null,
          requested_at: new Date().toISOString(),
        },
      },
      { onConflict: "workspace_id,lead_id,type" },
    );

    if (typeof config.from_number === "string") {
      const customerMessage = getPendingCustomerMessage(customerName, workspace.name, windowSummary);
      await sendSms(config.from_number, customerPhone, customerMessage);
      await supabase.from("conversations").insert({
        workspace_id: workspace.id,
        lead_id: leadId,
        channel: "sms",
        direction: "outbound",
        content: customerMessage,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        workspace_name: workspace.name,
        requested_window: {
          day_label: matchedGroup.day_label,
          label: matchedWindow.label,
          range_label: matchedWindow.range_label,
        },
        scheduled_at: matchedWindow.scheduled_at,
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
