import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

const QUALIFICATION_STEPS: Record<string, { question: string; nextStep: string }> = {
  step_1_service_type: { question: "Thanks! What type of service do you need? (for example plumbing, HVAC, electrical, and so on)", nextStep: "step_2_urgency" },
  step_2_urgency: { question: "How urgent is this? Reply:\n1 - Emergency (today)\n2 - Soon (this week)\n3 - Not urgent", nextStep: "step_3_zip" },
  step_3_zip: { question: "Last question - what is your zip code so we can check service coverage?", nextStep: "completed" },
};

const OPT_OUT_KEYWORDS = ["stop", "unsubscribe", "cancel", "quit", "end"];

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
      await sendSms(
        config.from_number,
        fromNumber,
        "Please reply with a number from 1 to 5 to rate your experience.",
      );
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
      const priority = rating === 1 ? "high" : "medium";
      await supabase.from("feedback_tickets").insert({
        workspace_id: workspaceId,
        review_request_id: review.id,
        content: `Rating: ${rating}/5. Customer feedback pending.`,
        status: "open",
        priority,
      });
      await logEvent(supabase, workspaceId, "private_ticket_created", {
        lead_id: leadId,
        review_request_id: review.id,
        rating,
        priority,
      });
    }

    const recoveryMsg = "Thank you for your feedback. We are sorry to hear about your experience. A manager will be in touch shortly to make things right.";
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
      const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/twilio-inbound-sms`;
      const valid = await validateTwilioSignature(twilioAuthToken, twilioSignature, webhookUrl, params);
      if (!valid) {
        await logEvent(supabase, workspace_id, "webhook_rejected", { reason: "invalid_signature", message_sid: messageSid });
        return new Response("<Response/>", { status: 403, headers: { "Content-Type": "text/xml" } });
      }
    } else if (twilioAuthToken && !twilioSignature) {
      await logEvent(supabase, workspace_id, "webhook_rejected", { reason: "missing_signature", message_sid: messageSid });
      return new Response("<Response/>", { status: 403, headers: { "Content-Type": "text/xml" } });
    }

    await logEvent(supabase, workspace_id, "sms_received", {
      from: fromNumber,
      to: toNumber,
      message_sid: messageSid,
      body_preview: body.substring(0, 100),
    });

    const normalized = normalizePhone(fromNumber);
    const { data: existingLeads } = await supabase
      .from("leads")
      .select("id")
      .eq("workspace_id", workspace_id)
      .eq("normalized_phone", normalized)
      .limit(1);

    let leadId: string;
    if (existingLeads && existingLeads.length > 0) {
      leadId = existingLeads[0].id;
    } else {
      const { data: newLead, error } = await supabase
        .from("leads")
        .insert({ workspace_id, name: fromNumber, phone: fromNumber, normalized_phone: normalized, source: "sms", status: "new" })
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

    if (/^\d$/.test(body.trim()) || /^[1-5]$/.test(body.trim())) {
      const handled = await handleReviewRating(supabase, config, workspace_id, leadId, fromNumber, body);
      if (handled) return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
    }

    const qualificationEnabled = config.qualification_flow !== false;
    if (qualificationEnabled) {
      const { data: session } = await supabase
        .from("automation_sessions")
        .select("*")
        .eq("workspace_id", workspace_id)
        .eq("lead_id", leadId)
        .eq("type", "qualification")
        .eq("status", "active")
        .single();

      if (session) {
        const currentStep = session.current_step;
        const stepConfig = QUALIFICATION_STEPS[currentStep];

        if (stepConfig) {
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

            if (config.auto_create_job !== false) {
              const { data: existingJob } = await supabase
                .from("jobs")
                .select("id")
                .eq("workspace_id", workspace_id)
                .eq("lead_id", leadId)
                .limit(1);
              if (!existingJob || existingJob.length === 0) {
                const { data: firstStage } = await supabase
                  .from("pipeline_stages")
                  .select("id")
                  .eq("workspace_id", workspace_id)
                  .order("position")
                  .limit(1)
                  .single();
                if (firstStage) {
                  await supabase.from("jobs").insert({ workspace_id, lead_id: leadId, stage_id: firstStage.id, status: "scheduled" });
                }
              }
            }

            let completionMsg = "Thanks! We have all the info we need. Someone will be in touch shortly.";
            if (config.booking_link) completionMsg += `\n\nBook directly here: ${config.booking_link}`;
            try {
              await sendSms(config.from_number, fromNumber, completionMsg);
              await supabase.from("conversations").insert({
                workspace_id,
                lead_id: leadId,
                channel: "sms",
                direction: "outbound",
                content: completionMsg,
              });
            } catch (err: any) {
              await logEvent(supabase, workspace_id, "error", { step: "completion_sms", error: err.message });
            }
            await logEvent(supabase, workspace_id, "qualification_completed", { lead_id: leadId, answers: updatedAnswers });
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
        }
      }
    }

    return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
  } catch (err: any) {
    console.error("inbound-sms error:", err);
    return new Response("<Response/>", { status: 200, headers: { "Content-Type": "text/xml" } });
  }
});
