import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { parseBookingConfirmationReply } from "../../../src/lib/booking-flow.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
  const key = await crypto.subtle.importKey("raw", encoder.encode(authToken), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(dataStr));
  return btoa(String.fromCharCode(...new Uint8Array(sig))) === signature;
}

function getServiceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

function getTwilioMasterAccountSid() {
  return Deno.env.get("TWILIO_MASTER_ACCOUNT_SID") || "";
}

function getTwilioMasterAuthToken() {
  return Deno.env.get("TWILIO_MASTER_AUTH_TOKEN") || "";
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return "+" + digits;
}

function urgencyLabel(raw: string) {
  if (raw === "1") return "today";
  if (raw === "2") return "this week";
  if (raw === "3") return "not urgent";
  return raw || "unspecified urgency";
}

function normalizeServiceTypeForBooking(raw: string) {
  const value = raw.trim().toLowerCase();
  if (!value) return "";
  if (value.includes("repair")) return "repair";
  if (value.includes("tune")) return "tune-up";
  if (value.includes("install")) return "install";
  return value.replace(/\s+/g, "-");
}

async function resolveWorkspace(supabase: any, toNumber: string) {
  const normalized = toNumber.replace(/\D/g, "");
  const { data: integrations } = await supabase
    .from("integrations")
    .select("workspace_id, config, status")
    .eq("provider", "twilio")
    .in("status", ["provisioned", "connected"]);
  if (!integrations) return null;
  for (const int of integrations) {
    const cfg = int.config as any;
    if (!cfg?.from_number) continue;
    const cfgNorm = cfg.from_number.replace(/\D/g, "");
    if (normalized === cfgNorm || normalized.endsWith(cfgNorm) || cfgNorm.endsWith(normalized)) {
      return { workspace_id: int.workspace_id, config: cfg };
    }
  }
  return null;
}

async function logEvent(supabase: any, workspaceId: string, eventType: string, payload: any) {
  await supabase.from("workflow_logs").insert({ workspace_id: workspaceId, event_type: eventType, payload });
}

async function sendSms(from: string, to: string, body: string) {
  const accountSid = getTwilioMasterAccountSid();
  const authToken = getTwilioMasterAuthToken();
  if (!accountSid || !authToken) throw new Error("Missing Twilio master credentials");

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

async function sendReviewRequestForJob(
  supabase: any,
  workspaceId: string,
  jobId: string,
  config: any,
) {
  const { data: existing } = await supabase
    .from("review_requests")
    .select("id")
    .eq("job_id", jobId)
    .limit(1);

  if (existing && existing.length > 0) {
    return { reviewRequestId: existing[0].id, alreadyExists: true, leadId: null, customerName: null };
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("id, lead_id, leads!inner(id, phone, name)")
    .eq("id", jobId)
    .single();

  if (!job?.leads?.phone) {
    throw new Error("Job is missing a customer phone number");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", workspaceId)
    .single();

  const now = new Date().toISOString();
  const { data: reviewRequest, error: reviewError } = await supabase
    .from("review_requests")
    .insert({
      workspace_id: workspaceId,
      job_id: jobId,
      status: "sent",
      outcome: "pending",
      sent_at: now,
      followup_count: 0,
    })
    .select("id")
    .single();

  if (reviewError) throw reviewError;

  const message = config.review_template || `How was your service with ${workspace?.name || "us"}? Reply 1-5.`;
  const smsResult = await sendSms(config.from_number, job.leads.phone, message);

  await supabase.from("conversations").insert({
    workspace_id: workspaceId,
    lead_id: job.leads.id,
    channel: "sms",
    direction: "outbound",
    content: message,
  });

  await logEvent(supabase, workspaceId, "review_sms_sent", {
    review_request_id: reviewRequest.id,
    job_id: jobId,
    lead_id: job.leads.id,
    message_sid: smsResult.sid,
    trigger: "contractor_sms_confirmation",
  });

  return {
    reviewRequestId: reviewRequest.id,
    alreadyExists: false,
    leadId: job.leads.id,
    customerName: job.leads.name,
  };
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

async function handleBookingConfirmationReply(
  supabase: any,
  workspaceId: string,
  config: any,
  body: string,
) {
  const { data: sessions } = await supabase
    .from("automation_sessions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("type", "booking_confirm")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1);

  const session = sessions?.[0];
  if (!session) return false;

  const parsedReply = parseBookingConfirmationReply(body);
  const answers = (session.answers as Record<string, any> | null) ?? {};
  const jobId = String(answers.job_id || "");
  const customerName = String(answers.customer_name || "the customer");
  const customerPhone = String(answers.customer_phone || "");
  const requestedWindow =
    answers.requested_window && typeof answers.requested_window === "object"
      ? (answers.requested_window as Record<string, any>)
      : null;
  const windowSummary = formatRequestedWindowLabel(requestedWindow);

  if (!jobId || !customerPhone) return false;

  if (parsedReply.action === "invalid") {
    await sendSms(
      config.from_number,
      config.contractor_phone,
      `Reply CONFIRM, CONFIRM 10AM, or CANCEL for ${customerName} (${windowSummary}).`,
    );
    return true;
  }

  if (parsedReply.action === "cancel") {
    await supabase
      .from("jobs")
      .update({
        status: "cancelled",
        completed_at: null,
      })
      .eq("id", jobId);

    await supabase
      .from("automation_sessions")
      .update({
        status: "completed",
        current_step: "cancelled",
        answers: {
          ...answers,
          contractor_reply: "CANCEL",
          responded_at: new Date().toISOString(),
        },
      })
      .eq("id", session.id);

    const customerMessage = `Your ${windowSummary} request has been cancelled. The contractor will follow up if you need a new service window.`;
    await sendSms(config.from_number, customerPhone, customerMessage);
    await supabase.from("conversations").insert({
      workspace_id: workspaceId,
      lead_id: session.lead_id,
      channel: "sms",
      direction: "outbound",
      content: customerMessage,
    });
    await logEvent(supabase, workspaceId, "booking_request_cancelled", {
      job_id: jobId,
      customer_name: customerName,
      requested_window: requestedWindow,
    });
    return true;
  }

  await supabase
    .from("jobs")
    .update({
      status: "scheduled",
      completed_at: null,
    })
    .eq("id", jobId);

  await supabase
    .from("automation_sessions")
    .update({
      status: "completed",
      current_step: "confirmed",
      answers: {
        ...answers,
        contractor_reply: parsedReply.arrivalText ? `CONFIRM ${parsedReply.arrivalText}` : "CONFIRM",
        arrival_text: parsedReply.arrivalText,
        responded_at: new Date().toISOString(),
      },
    })
    .eq("id", session.id);

  const customerMessage = parsedReply.arrivalText
    ? `Your ${windowSummary} request is confirmed. Approximate arrival: ${parsedReply.arrivalText}.`
    : `Your ${windowSummary} request is confirmed. The contractor will follow up if they need to narrow the exact arrival time.`;

  await sendSms(config.from_number, customerPhone, customerMessage);
  await supabase.from("conversations").insert({
    workspace_id: workspaceId,
    lead_id: session.lead_id,
    channel: "sms",
    direction: "outbound",
    content: customerMessage,
  });
  await logEvent(supabase, workspaceId, "booking_request_confirmed", {
    job_id: jobId,
    customer_name: customerName,
    requested_window: requestedWindow,
    arrival_text: parsedReply.arrivalText,
  });
  return true;
}

async function handleReviewRating(
  supabase: any,
  config: any,
  workspaceId: string,
  leadId: string,
  fromNumber: string,
  body: string,
): Promise<boolean> {
  const { data: pendingReview } = await supabase
    .from("review_requests")
    .select("*, jobs!inner(lead_id, workspace_id)")
    .eq("workspace_id", workspaceId)
    .eq("status", "sent")
    .limit(10);

  if (!pendingReview || pendingReview.length === 0) return false;

  const review = pendingReview.find((row: any) => row.jobs?.lead_id === leadId);
  if (!review) return false;

  const rating = parseInt(body.trim(), 10);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    try {
      await sendSms(config.from_number, fromNumber, "Please reply with a number from 1 to 5 to rate your experience.");
      await supabase.from("conversations").insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        channel: "sms",
        direction: "outbound",
        content: "Please reply with a number from 1 to 5 to rate your experience.",
      });
    } catch (_) {
      // Best effort only.
    }
    return true;
  }

  const now = new Date().toISOString();

  if (rating >= 4) {
    const { data: job } = await supabase
      .from("jobs")
      .select("lead_id, workspace_id, leads!inner(location_id)")
      .eq("id", review.job_id)
      .single();

    let googleLink = "";
    if (job?.leads?.location_id) {
      const { data: loc } = await supabase
        .from("locations")
        .select("google_review_link")
        .eq("id", job.leads.location_id)
        .single();
      googleLink = loc?.google_review_link || "";
    }
    if (!googleLink) {
      const { data: locs } = await supabase
        .from("locations")
        .select("google_review_link")
        .eq("workspace_id", workspaceId)
        .not("google_review_link", "is", null)
        .limit(1);
      googleLink = locs?.[0]?.google_review_link || "";
    }

    await supabase.from("review_requests").update({
      rating_value: rating,
      status: "completed",
      outcome: "public_redirected",
      responded_at: now,
    }).eq("id", review.id);

    if (googleLink) {
      const msg = `Thank you for the ${rating}-star rating. We would love if you could share your experience:\n${googleLink}`;
      try {
        await sendSms(config.from_number, fromNumber, msg);
        await supabase.from("conversations").insert({
          workspace_id: workspaceId,
          lead_id: leadId,
          channel: "sms",
          direction: "outbound",
          content: msg,
        });
        await logEvent(supabase, workspaceId, "google_redirect_sent", { lead_id: leadId, review_request_id: review.id, rating });
      } catch (err: any) {
        await logEvent(supabase, workspaceId, "review_error", { step: "google_redirect_sms", error: err.message });
      }
    }
  } else {
    await supabase.from("review_requests").update({
      rating_value: rating,
      status: "completed",
      outcome: "private_recovery",
      responded_at: now,
    }).eq("id", review.id);

    const { data: existingTicket } = await supabase
      .from("feedback_tickets")
      .select("id")
      .eq("review_request_id", review.id)
      .limit(1);

    if (!existingTicket || existingTicket.length === 0) {
      await supabase.from("feedback_tickets").insert({
        workspace_id: workspaceId,
        review_request_id: review.id,
        content: `Rating: ${rating}/5. Customer feedback pending.`,
        status: "open",
        priority: rating === 1 ? "high" : "medium",
      });
      await logEvent(supabase, workspaceId, "private_ticket_created", {
        lead_id: leadId,
        review_request_id: review.id,
        rating,
      });
    }

    const recoveryMsg = "Thank you for your feedback. We appreciate you letting us know.";
    try {
      await sendSms(config.from_number, fromNumber, recoveryMsg);
      await supabase.from("conversations").insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        channel: "sms",
        direction: "outbound",
        content: recoveryMsg,
      });
    } catch (_) {
      // Best effort only.
    }
  }

  await logEvent(supabase, workspaceId, "rating_received", {
    lead_id: leadId,
    review_request_id: review.id,
    rating,
    outcome: rating >= 4 ? "public_redirected" : "private_recovery",
  });

  return true;
}

async function handleContractorReply(
  supabase: any,
  workspaceId: string,
  config: any,
  body: string,
) {
  const reply = body.trim().toUpperCase();
  const { data: sessions } = await supabase
    .from("automation_sessions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("type", "review_confirm")
    .in("status", ["active", "skipped"])
    .order("updated_at", { ascending: false })
    .limit(1);

  const session = sessions?.[0];
  if (!session) return false;

  const answers = (session.answers as Record<string, any> | null) ?? {};
  const jobId = String(answers.job_id || "");
  const customerName = String(answers.customer_name || "the customer");
  const attempts = Number(answers.attempts || 1);

  if (!jobId) return false;

  if (reply !== "YES" && reply !== "NO") {
    await sendSms(config.from_number, config.contractor_phone, `Reply YES to send the review request for ${customerName}, or NO to skip for now.`);
    return true;
  }

  if (reply === "YES") {
    const { reviewRequestId, alreadyExists } = await sendReviewRequestForJob(supabase, workspaceId, jobId, config);
    await supabase
      .from("automation_sessions")
      .update({
        status: "completed",
        current_step: "completed",
        answers: {
          ...answers,
          attempts,
          last_reply: "YES",
          review_request_id: reviewRequestId,
          responded_at: new Date().toISOString(),
        },
      })
      .eq("id", session.id);

    await supabase
      .from("jobs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", jobId);

    await sendSms(
      config.from_number,
      config.contractor_phone,
      alreadyExists ? `A review request for ${customerName} was already sent.` : `Review request sent to ${customerName}.`,
    );
    await logEvent(supabase, workspaceId, "contractor_review_confirmed", {
      job_id: jobId,
      review_request_id: reviewRequestId,
      customer_name: customerName,
    });
    return true;
  }

  const nextCheckAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("automation_sessions")
    .update({
      status: "skipped",
      current_step: "waiting_retry",
      answers: {
        ...answers,
        attempts,
        last_reply: "NO",
        next_check_at: nextCheckAt,
        responded_at: new Date().toISOString(),
      },
    })
    .eq("id", session.id);

  await sendSms(config.from_number, config.contractor_phone, `Okay. We will check again in 2 days for ${customerName}.`);
  await logEvent(supabase, workspaceId, "contractor_review_skipped", {
    job_id: jobId,
    customer_name: customerName,
    next_check_at: nextCheckAt,
  });
  return true;
}

async function handleOnboardingSmsVerification(
  supabase: any,
  workspaceId: string,
  config: any,
  fromNumber: string,
  body: string,
) {
  if (!body.trim()) return false;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("onboarding_config")
    .eq("id", workspaceId)
    .single();

  const onboardingConfig =
    workspace?.onboarding_config &&
    typeof workspace.onboarding_config === "object" &&
    !Array.isArray(workspace.onboarding_config)
      ? workspace.onboarding_config
      : {};

  if (!onboardingConfig.test_call_started_at || onboardingConfig.test_call_verified) {
    return false;
  }

  const checklist =
    onboardingConfig.checklist &&
    typeof onboardingConfig.checklist === "object" &&
    !Array.isArray(onboardingConfig.checklist)
      ? onboardingConfig.checklist
      : {};

  const confirmationMessage = "NexaOS is connected. Customers can now text and call this number.";

  await sendSms(config.from_number, fromNumber, confirmationMessage);

  await supabase
    .from("workspaces")
    .update({
      onboarding_config: {
        ...onboardingConfig,
        test_call_verified: true,
        test_call_verified_at: new Date().toISOString(),
        checklist: {
          ...checklist,
          twilio_connected: true,
        },
      } as any,
    })
    .eq("id", workspaceId);

  await supabase
    .from("integrations")
    .update({ status: "connected", connected_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("provider", "twilio");

  await supabase
    .from("provisioned_numbers")
    .update({ status: "active" })
    .eq("workspace_id", workspaceId);

  await logEvent(supabase, workspaceId, "sms_test_verified", {
    contractor_phone: config.contractor_phone,
    inbound_preview: body.substring(0, 100),
  });

  return true;
}

const QUALIFICATION_STEPS: Record<string, { question: string; nextStep: string }> = {
  step_1_service_type: {
    question: "Repair, tune-up, or install?",
    nextStep: "step_2_urgency",
  },
  step_2_urgency: {
    question: "How urgent is this? Reply 1 for today, 2 for this week, or 3 for not urgent.",
    nextStep: "step_3_zip",
  },
  step_3_zip: {
    question: "What is your zip code?",
    nextStep: "completed",
  },
};

const OPT_OUT_KEYWORDS = ["stop", "unsubscribe", "cancel", "quit", "end"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const supabase = getServiceClient();

  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((val, key) => {
      params[key] = val.toString();
    });

    const messageSid = params.MessageSid || params.SmsSid || "";
    const fromNumber = params.From || "";
    const toNumber = params.To || "";
    const body = (params.Body || "").trim();

    const ws = await resolveWorkspace(supabase, toNumber);
    if (!ws) {
      console.log("Unknown inbound SMS to:", toNumber);
      await logEvent(supabase, "00000000-0000-0000-0000-000000000000", "webhook_rejected", {
        reason: "unknown_sms_number",
        to: toNumber,
        from: fromNumber,
      });
      return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
    }

    const { workspace_id, config } = ws;

    const twilioSignature = req.headers.get("X-Twilio-Signature") || "";
    const twilioAuthToken = getTwilioMasterAuthToken();
    if (twilioAuthToken && twilioSignature) {
      const valid = await validateTwilioSignature(twilioAuthToken, twilioSignature, req.url, params);
      if (!valid) {
        await logEvent(supabase, workspace_id, "webhook_signature_invalid_ignored", {
          message_sid: messageSid,
          url: req.url,
        });
      }
    } else if (twilioAuthToken && !twilioSignature) {
      await logEvent(supabase, workspace_id, "webhook_signature_missing", {
        message_sid: messageSid,
        user_agent: req.headers.get("User-Agent") || "",
      });
    }

    await logEvent(supabase, workspace_id, "sms_received", {
      from: fromNumber,
      to: toNumber,
      message_sid: messageSid,
      body_preview: body.substring(0, 100),
    });

    const normalizedFrom = normalizePhone(fromNumber);
    const contractorPhone = config.contractor_phone ? normalizePhone(config.contractor_phone) : "";
    if (contractorPhone && normalizedFrom === contractorPhone) {
      const verified = await handleOnboardingSmsVerification(supabase, workspace_id, config, fromNumber, body);
      if (verified) {
        return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
      }

      const bookingHandled = await handleBookingConfirmationReply(supabase, workspace_id, config, body);
      if (bookingHandled) {
        return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
      }

      const handled = await handleContractorReply(supabase, workspace_id, config, body);
      if (handled) {
        return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
      }
    }

    const { data: existingLeads } = await supabase
      .from("leads")
      .select("id")
      .eq("workspace_id", workspace_id)
      .eq("normalized_phone", normalizedFrom)
      .limit(1);

    let leadId: string;
    if (existingLeads && existingLeads.length > 0) {
      leadId = existingLeads[0].id;
    } else {
      const { data: newLead, error } = await supabase
        .from("leads")
        .insert({ workspace_id, name: fromNumber, phone: fromNumber, normalized_phone: normalizedFrom, source: "sms", status: "new" })
        .select("id")
        .single();
      if (error) throw error;
      leadId = newLead.id;
      await logEvent(supabase, workspace_id, "lead_upserted", { lead_id: leadId, phone: fromNumber });
    }

    if (messageSid) {
      const { data: recent } = await supabase
        .from("conversations")
        .select("id")
        .eq("lead_id", leadId)
        .eq("channel", "sms")
        .eq("direction", "inbound")
        .eq("content", body)
        .gte("created_at", new Date(Date.now() - 60000).toISOString())
        .limit(1);
      if (recent && recent.length > 0) {
        return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
      }
    }

    await supabase.from("conversations").insert({
      workspace_id,
      lead_id: leadId,
      channel: "sms",
      direction: "inbound",
      content: body,
    });

    if (OPT_OUT_KEYWORDS.includes(body.toLowerCase())) {
      await supabase
        .from("automation_sessions")
        .update({ status: "opted_out" })
        .eq("workspace_id", workspace_id)
        .eq("lead_id", leadId)
        .eq("type", "qualification");
      await logEvent(supabase, workspace_id, "opt_out", { lead_id: leadId, message: body });
      return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
    }

    const optedOut = await isOptedOut(supabase, workspace_id, leadId);
    if (optedOut) {
      await logEvent(supabase, workspace_id, "sms_blocked_opt_out", { lead_id: leadId });
      return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
    }

    if (/^[1-5]$/.test(body.trim())) {
      const handled = await handleReviewRating(supabase, config, workspace_id, leadId, fromNumber, body);
      if (handled) return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
    }

    if (config.qualification_flow === false) {
      return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
    }

    const { data: session } = await supabase
      .from("automation_sessions")
      .select("*")
      .eq("workspace_id", workspace_id)
      .eq("lead_id", leadId)
      .eq("type", "qualification")
      .eq("status", "active")
      .single();

    if (!session) {
      return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
    }

    const currentStep = session.current_step;
    const stepConfig = QUALIFICATION_STEPS[currentStep];
    if (!stepConfig) {
      return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
    }

    const answerKey = currentStep.replace("step_", "").replace(/^\d+_/, "");
    const updatedAnswers = { ...((session.answers as any) || {}), [answerKey]: body };

    if (stepConfig.nextStep === "completed") {
      await supabase.from("automation_sessions").update({
        current_step: "completed",
        answers: updatedAnswers,
        status: "completed",
        last_message_sid: messageSid,
      }).eq("id", session.id);
      await supabase.from("leads").update({ status: "qualified" }).eq("id", leadId);

      let jobId: string | null = null;
      if (config.auto_create_job !== false) {
        const { data: existingJob } = await supabase
          .from("jobs")
          .select("id")
          .eq("workspace_id", workspace_id)
          .eq("lead_id", leadId)
          .limit(1);
        if (existingJob && existingJob.length > 0) {
          jobId = existingJob[0].id;
        } else {
          const { data: firstStage } = await supabase
            .from("pipeline_stages")
            .select("id")
            .eq("workspace_id", workspace_id)
            .order("position")
            .limit(1)
            .single();
          if (firstStage) {
            const { data: job } = await supabase
              .from("jobs")
              .insert({ workspace_id, lead_id: leadId, stage_id: firstStage.id, status: "scheduled" })
              .select("id")
              .single();
            jobId = job?.id ?? null;
          }
        }
      }

      const { data: workspace } = await supabase
        .from("workspaces")
        .select("name")
        .eq("id", workspace_id)
        .single();

      const contractorMessage = `New lead: ${updatedAnswers.service_type || "service request"}, ${urgencyLabel(updatedAnswers.urgency || "")}, ${updatedAnswers.zip || "no zip"}.\nCustomer: ${fromNumber}.\n${config.booking_link ? "Booking now." : "Reach out when you're ready."}`;

      if (config.contractor_phone) {
        try {
          await sendSms(config.from_number, config.contractor_phone, contractorMessage);
          await logEvent(supabase, workspace_id, "contractor_sms_sent", {
            lead_id: leadId,
            job_id: jobId,
            contractor_phone: config.contractor_phone,
          });
        } catch (err: any) {
          await logEvent(supabase, workspace_id, "error", { step: "contractor_notification_sms", error: err.message });
        }
      }

      const bookingLink =
        config.booking_link && config.booking_mode === "nexaos"
          ? `${config.booking_link}${String(config.booking_link).includes("?") ? "&" : "?"}service=${encodeURIComponent(
              normalizeServiceTypeForBooking(String(updatedAnswers.service_type || "")),
            )}`
          : config.booking_link;

      const customerMessage = bookingLink
        ? `Book a time that works for you: ${bookingLink}`
        : `Got it! Someone from ${workspace?.name || "the team"} will contact you shortly.`;

      try {
        await sendSms(config.from_number, fromNumber, customerMessage);
        await supabase.from("conversations").insert({
          workspace_id,
          lead_id: leadId,
          channel: "sms",
          direction: "outbound",
          content: customerMessage,
        });
      } catch (err: any) {
        await logEvent(supabase, workspace_id, "error", { step: "completion_sms", error: err.message });
      }

      await logEvent(supabase, workspace_id, "qualification_completed", {
        lead_id: leadId,
        job_id: jobId,
        answers: updatedAnswers,
      });
    } else {
      await supabase.from("automation_sessions").update({
        current_step: stepConfig.nextStep,
        answers: updatedAnswers,
        last_message_sid: messageSid,
      }).eq("id", session.id);

      const nextQuestion = QUALIFICATION_STEPS[stepConfig.nextStep];
      if (nextQuestion) {
        try {
          await sendSms(config.from_number, fromNumber, nextQuestion.question);
          await supabase.from("conversations").insert({
            workspace_id,
            lead_id: leadId,
            channel: "sms",
            direction: "outbound",
            content: nextQuestion.question,
          });
        } catch (err: any) {
          await logEvent(supabase, workspace_id, "error", { step: "qualification_sms", error: err.message });
        }
      }
      await supabase.from("leads").update({ status: "contacted" }).eq("id", leadId);
      await logEvent(supabase, workspace_id, "qualification_step", {
        lead_id: leadId,
        from_step: currentStep,
        to_step: stepConfig.nextStep,
        answer: body,
      });
    }

    return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
  } catch (err: any) {
    console.error("inbound-sms error:", err);
    return new Response("<Response/>", { status: 200, headers: { "Content-Type": "text/xml" } });
  }
});
