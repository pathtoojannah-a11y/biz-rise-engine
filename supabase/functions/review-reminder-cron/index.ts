import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function shouldSendReminder(followupCount: number, sentAt: string): boolean {
  const elapsed = hoursSince(sentAt);
  if (followupCount === 0) return elapsed >= 24;
  if (followupCount === 1) return elapsed >= 72;
  return false;
}

function shouldFinalizeNoResponse(followupCount: number, sentAt: string): boolean {
  return followupCount >= 2 && hoursSince(sentAt) >= 96;
}

function withinOfficeHours(config: any, timezone: string | null): boolean {
  if (!config?.office_hours) return true;
  const officeHours = config.office_hours as { enabled?: boolean; start?: string; end?: string };
  if (!officeHours.enabled || !officeHours.start || !officeHours.end) return true;

  const tz = timezone || "UTC";
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
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

async function sendSms(from: string, to: string, body: string) {
  const accountSid = Deno.env.get("TWILIO_MASTER_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_MASTER_AUTH_TOKEN");
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
  if (!resp.ok) throw new Error(result?.message || "Twilio send failed");
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

async function logEvent(supabase: any, workspaceId: string, eventType: string, payload: any) {
  await supabase.from("workflow_logs").insert({ workspace_id: workspaceId, event_type: eventType, payload });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cronSecret = Deno.env.get("REVIEW_REMINDER_CRON_SECRET");
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
    const { data: integrations, error: integrationError } = await supabase
      .from("integrations")
      .select("workspace_id, config, status")
      .eq("provider", "twilio")
      .eq("status", "connected");

    if (integrationError) throw integrationError;

    let contractorPromptsSent = 0;
    let contractorPromptsSkipped = 0;
    let remindersSent = 0;
    let finalizedNoResponse = 0;
    let skippedOptOut = 0;

    for (const integration of integrations || []) {
      const config = (integration.config as Record<string, any> | null) ?? {};
      if (!config.from_number || !config.contractor_phone) continue;

      const { data: workspace } = await supabase
        .from("workspaces")
        .select("timezone")
        .eq("id", integration.workspace_id)
        .single();

      if (!withinOfficeHours(config, workspace?.timezone || null)) {
        contractorPromptsSkipped++;
        continue;
      }

      const reviewDelayDays = Number(config.review_delay_days || 2) || 2;
      const cutoffIso = new Date(Date.now() - reviewDelayDays * 24 * 60 * 60 * 1000).toISOString();

      const { data: dueJobs } = await supabase
        .from("jobs")
        .select("id, lead_id, scheduled_at, status, leads!inner(name, phone)")
        .eq("workspace_id", integration.workspace_id)
        .eq("status", "scheduled")
        .lte("scheduled_at", cutoffIso);

      for (const job of dueJobs || []) {
        if (!job.lead_id || !job.leads?.name) continue;

        const optedOut = await isOptedOut(supabase, integration.workspace_id, job.lead_id);
        if (optedOut) {
          skippedOptOut++;
          await logEvent(supabase, integration.workspace_id, "reminder_skipped", {
            reason: "opted_out",
            lead_id: job.lead_id,
            job_id: job.id,
            flow: "review_confirm",
          });
          continue;
        }

        const { data: existingReviewRequest } = await supabase
          .from("review_requests")
          .select("id")
          .eq("job_id", job.id)
          .limit(1);
        if (existingReviewRequest && existingReviewRequest.length > 0) {
          continue;
        }

        const { data: existingSession } = await supabase
          .from("automation_sessions")
          .select("*")
          .eq("workspace_id", integration.workspace_id)
          .eq("lead_id", job.lead_id)
          .eq("type", "review_confirm")
          .maybeSingle();

        const answers = (existingSession?.answers as Record<string, any> | null) ?? {};
        const attempts = Number(answers.attempts || 0);
        const nextCheckAt = answers.next_check_at ? new Date(String(answers.next_check_at)).getTime() : 0;

        if (existingSession?.status === "active") {
          continue;
        }

        if (existingSession?.status === "skipped" && attempts >= 2) {
          contractorPromptsSkipped++;
          continue;
        }

        if (existingSession?.status === "skipped" && nextCheckAt && nextCheckAt > Date.now()) {
          contractorPromptsSkipped++;
          continue;
        }

        const prompt = `Job for ${job.leads.name} done? Reply YES to send the review request or NO to skip for now.`;

        try {
          const result = await sendSms(config.from_number, config.contractor_phone, prompt);
          await supabase.from("automation_sessions").upsert({
            workspace_id: integration.workspace_id,
            lead_id: job.lead_id,
            type: "review_confirm",
            status: "active",
            current_step: "awaiting_confirmation",
            answers: {
              ...answers,
              job_id: job.id,
              customer_name: job.leads.name,
              attempts: attempts + 1,
              next_check_at: null,
            },
            last_message_sid: result.sid,
          }, { onConflict: "workspace_id,lead_id,type" });
          contractorPromptsSent++;
          await logEvent(supabase, integration.workspace_id, "contractor_review_prompt_sent", {
            job_id: job.id,
            lead_id: job.lead_id,
            contractor_phone: config.contractor_phone,
            message_sid: result.sid,
            attempts: attempts + 1,
          });
        } catch (err: any) {
          await logEvent(supabase, integration.workspace_id, "review_error", {
            step: "contractor_review_prompt",
            job_id: job.id,
            error: err.message,
          });
        }
      }
    }

    const { data: pending, error } = await supabase
      .from("review_requests")
      .select("id, workspace_id, job_id, followup_count, sent_at, responded_at, status, outcome")
      .eq("status", "sent")
      .is("responded_at", null)
      .order("sent_at", { ascending: true })
      .limit(500);

    if (error) throw error;

    for (const reviewRequest of pending || []) {
      if (!reviewRequest.sent_at) continue;

      const { data: job } = await supabase
        .from("jobs")
        .select("id, lead_id")
        .eq("id", reviewRequest.job_id)
        .single();
      if (!job?.lead_id) continue;

      const { data: lead } = await supabase
        .from("leads")
        .select("id, phone")
        .eq("id", job.lead_id)
        .single();
      if (!lead?.phone) continue;

      const optedOut = await isOptedOut(supabase, reviewRequest.workspace_id, job.lead_id);
      if (optedOut) {
        skippedOptOut++;
        await logEvent(supabase, reviewRequest.workspace_id, "reminder_skipped", { reason: "opted_out", review_request_id: reviewRequest.id, lead_id: job.lead_id });
        continue;
      }

      const { data: integration } = await supabase
        .from("integrations")
        .select("config, status")
        .eq("workspace_id", reviewRequest.workspace_id)
        .eq("provider", "twilio")
        .eq("status", "connected")
        .single();
      if (!integration?.config) continue;

      const cfg = integration.config as any;
      if (!cfg.from_number) continue;

      const { data: workspace } = await supabase
        .from("workspaces")
        .select("timezone")
        .eq("id", reviewRequest.workspace_id)
        .single();
      if (!withinOfficeHours(cfg, workspace?.timezone || null)) {
        await logEvent(supabase, reviewRequest.workspace_id, "reminder_skipped", { reason: "outside_office_hours", review_request_id: reviewRequest.id });
        continue;
      }

      if (shouldSendReminder(reviewRequest.followup_count, reviewRequest.sent_at)) {
        const msg = "Quick reminder: please rate your recent experience from 1-5 by replying to this message.";
        try {
          const twilioResult = await sendSms(cfg.from_number, lead.phone, msg);
          await supabase.from("conversations").insert({
            workspace_id: reviewRequest.workspace_id,
            lead_id: job.lead_id,
            channel: "sms",
            direction: "outbound",
            content: msg,
          });
          await supabase
            .from("review_requests")
            .update({ followup_count: reviewRequest.followup_count + 1, updated_at: new Date().toISOString() as any })
            .eq("id", reviewRequest.id);
          remindersSent++;
          await logEvent(supabase, reviewRequest.workspace_id, "reminder_sent", {
            review_request_id: reviewRequest.id,
            lead_id: job.lead_id,
            message_sid: twilioResult.sid,
            followup_count: reviewRequest.followup_count + 1,
          });
        } catch (err: any) {
          await logEvent(supabase, reviewRequest.workspace_id, "review_error", {
            step: "reminder_send",
            review_request_id: reviewRequest.id,
            error: err.message,
          });
        }
      } else if (shouldFinalizeNoResponse(reviewRequest.followup_count, reviewRequest.sent_at)) {
        await supabase
          .from("review_requests")
          .update({ outcome: "no_response", status: "declined", updated_at: new Date().toISOString() as any })
          .eq("id", reviewRequest.id);
        finalizedNoResponse++;
        await logEvent(supabase, reviewRequest.workspace_id, "no_response_finalized", {
          review_request_id: reviewRequest.id,
          lead_id: job.lead_id,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      contractorPromptsSent,
      contractorPromptsSkipped,
      remindersSent,
      finalizedNoResponse,
      skippedOptOut,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
