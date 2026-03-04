import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
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
    .select("workspace_id, config")
    .eq("provider", "twilio")
    .eq("status", "connected");

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

async function sendSms(accountSid: string, authToken: string, from: string, to: string, body: string) {
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

const QUALIFICATION_STEPS: Record<string, { question: string; nextStep: string }> = {
  step_1_service_type: {
    question: "Thanks! What type of service do you need? (e.g., plumbing, HVAC, electrical, etc.)",
    nextStep: "step_2_urgency",
  },
  step_2_urgency: {
    question: "How urgent is this? Reply:\n1 - Emergency (today)\n2 - Soon (this week)\n3 - Not urgent",
    nextStep: "step_3_zip",
  },
  step_3_zip: {
    question: "Last question — what's your zip code so we can check service coverage?",
    nextStep: "completed",
  },
};

const OPT_OUT_KEYWORDS = ["stop", "unsubscribe", "cancel", "quit", "end"];

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

    const messageSid = params.MessageSid || params.SmsSid || "";
    const fromNumber = params.From || "";
    const toNumber = params.To || "";
    const body = (params.Body || "").trim();

    // Resolve workspace
    const ws = await resolveWorkspace(supabase, toNumber);
    if (!ws) {
      console.log("Unknown inbound SMS to:", toNumber);
      return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
    }

    const { workspace_id, config } = ws;

    await logEvent(supabase, workspace_id, "sms_received", {
      from: fromNumber,
      to: toNumber,
      message_sid: messageSid,
      body_preview: body.substring(0, 100),
    });

    // Find or create lead
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
        .insert({
          workspace_id,
          name: fromNumber,
          phone: fromNumber,
          normalized_phone: normalized,
          source: "sms",
          status: "new",
        })
        .select("id")
        .single();
      if (error) throw error;
      leadId = newLead.id;
      await logEvent(supabase, workspace_id, "lead_upserted", { lead_id: leadId, phone: fromNumber });
    }

    // Dedupe by message SID - check if conversation already exists
    if (messageSid) {
      // Simple approach: check recent conversations for same content from same lead in last minute
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

    // Store inbound conversation
    await supabase.from("conversations").insert({
      workspace_id,
      lead_id: leadId,
      channel: "sms",
      direction: "inbound",
      content: body,
    });

    // Check opt-out
    if (OPT_OUT_KEYWORDS.includes(body.toLowerCase())) {
      await supabase
        .from("automation_sessions")
        .update({ status: "opted_out" })
        .eq("workspace_id", workspace_id)
        .eq("lead_id", leadId)
        .eq("type", "qualification");

      await logEvent(supabase, workspace_id, "opt_out", { lead_id: leadId });

      return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
    }

    // Qualification flow
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
          // Store answer
          const answerKey = currentStep.replace("step_", "").replace(/^\d+_/, "");
          const updatedAnswers = { ...((session.answers as any) || {}), [answerKey]: body };

          if (stepConfig.nextStep === "completed") {
            // Qualification complete
            await supabase
              .from("automation_sessions")
              .update({
                current_step: "completed",
                answers: updatedAnswers,
                status: "completed",
                last_message_sid: messageSid,
              })
              .eq("id", session.id);

            // Update lead status
            await supabase
              .from("leads")
              .update({ status: "qualified" })
              .eq("id", leadId);

            // Create job in first stage if enabled
            if (config.auto_create_job !== false) {
              const { data: firstStage } = await supabase
                .from("pipeline_stages")
                .select("id")
                .eq("workspace_id", workspace_id)
                .order("position")
                .limit(1)
                .single();

              if (firstStage) {
                await supabase.from("jobs").insert({
                  workspace_id,
                  lead_id: leadId,
                  stage_id: firstStage.id,
                  status: "scheduled",
                });
              }
            }

            // Send completion message
            let completionMsg = "Thanks! We have all the info we need. Someone will be in touch shortly.";
            if (config.booking_link) {
              completionMsg += `\n\nBook directly here: ${config.booking_link}`;
            }

            try {
              await sendSms(config.account_sid, config.auth_token, config.from_number, fromNumber, completionMsg);
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

            await logEvent(supabase, workspace_id, "qualification_completed", {
              lead_id: leadId,
              answers: updatedAnswers,
            });
          } else {
            // Move to next step
            await supabase
              .from("automation_sessions")
              .update({
                current_step: stepConfig.nextStep,
                answers: updatedAnswers,
                last_message_sid: messageSid,
              })
              .eq("id", session.id);

            // Send next question
            const nextQ = QUALIFICATION_STEPS[stepConfig.nextStep];
            if (nextQ) {
              try {
                await sendSms(config.account_sid, config.auth_token, config.from_number, fromNumber, nextQ.question);
                await supabase.from("conversations").insert({
                  workspace_id,
                  lead_id: leadId,
                  channel: "sms",
                  direction: "outbound",
                  content: nextQ.question,
                });
              } catch (err: any) {
                await logEvent(supabase, workspace_id, "error", { step: "qualification_sms", error: err.message });
              }
            }

            // Update lead status to contacted
            await supabase
              .from("leads")
              .update({ status: "contacted" })
              .eq("id", leadId);

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
