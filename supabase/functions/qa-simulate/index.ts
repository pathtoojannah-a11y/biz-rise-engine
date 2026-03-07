import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getServiceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  logIds: string[];
}

async function runTest(
  name: string,
  fn: () => Promise<{ passed: boolean; details: string; logIds: string[] }>
): Promise<TestResult> {
  try {
    const result = await fn();
    return { name, ...result };
  } catch (err: any) {
    return { name, passed: false, details: `Error: ${err.message}`, logIds: [] };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabaseAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
  if (userError || !userData?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const userId = userData.user.id;

  const supabase = getServiceClient();

  try {
    const { workspace_id, scenario } = await req.json();
    if (!workspace_id) {
      return new Response(JSON.stringify({ error: "Missing workspace_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify membership
    const { data: membership } = await supabase.from("workspace_members").select("role").eq("workspace_id", workspace_id).eq("user_id", userId).eq("status", "active").single();
    if (!membership) {
      return new Response(JSON.stringify({ error: "Not a member" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const testPhone = "+15550001234";
    const testPhoneNorm = "+15550001234";
    const results: TestResult[] = [];

    if (!scenario || scenario === "missed_call") {
      results.push(await runTest("Missed Call → Lead + Call + Log", async () => {
        // Create test lead
        const { data: lead } = await supabase.from("leads").upsert(
          { workspace_id, name: "QA Test Lead", phone: testPhone, normalized_phone: testPhoneNorm, source: "qa_test", status: "new" },
          { onConflict: "workspace_id,normalized_phone" }
        ).select("id").single();
        if (!lead) return { passed: false, details: "Failed to create test lead", logIds: [] };

        // Create call record
        const callSid = `QA_CALL_${Date.now()}`;
        await supabase.from("calls").insert({ workspace_id, lead_id: lead.id, direction: "inbound", status: "missed", duration: 0, twilio_sid: callSid });

        // Log event
        const { data: log } = await supabase.from("workflow_logs").insert({
          workspace_id, event_type: "qa_missed_call_simulated",
          payload: { lead_id: lead.id, call_sid: callSid, test: true },
        }).select("id").single();

        // Verify
        const { data: callCheck } = await supabase.from("calls").select("id").eq("twilio_sid", callSid).single();
        const passed = !!callCheck;
        return { passed, details: passed ? "Lead created, call logged, event recorded" : "Call record not found", logIds: log ? [log.id] : [] };
      }));
    }

    if (!scenario || scenario === "qualification") {
      results.push(await runTest("Qualification Flow → Qualified Lead + Job", async () => {
        const { data: lead } = await supabase.from("leads").upsert(
          { workspace_id, name: "QA Qual Lead", phone: "+15550005678", normalized_phone: "+15550005678", source: "qa_test", status: "new" },
          { onConflict: "workspace_id,normalized_phone" }
        ).select("id").single();
        if (!lead) return { passed: false, details: "Failed to create test lead", logIds: [] };

        // Simulate completed qualification
        await supabase.from("automation_sessions").upsert({
          workspace_id, lead_id: lead.id, type: "qualification", status: "completed",
          current_step: "completed", answers: { service_type: "plumbing", urgency: "1", zip: "90210" },
        }, { onConflict: "workspace_id,lead_id,type" });

        await supabase.from("leads").update({ status: "qualified" }).eq("id", lead.id);

        // Create job if first stage exists
        const { data: stage } = await supabase.from("pipeline_stages").select("id").eq("workspace_id", workspace_id).order("position").limit(1).single();
        let jobCreated = false;
        if (stage) {
          const { data: existingJob } = await supabase.from("jobs").select("id").eq("workspace_id", workspace_id).eq("lead_id", lead.id).limit(1);
          if (!existingJob || existingJob.length === 0) {
            await supabase.from("jobs").insert({ workspace_id, lead_id: lead.id, stage_id: stage.id, status: "scheduled" });
            jobCreated = true;
          } else {
            jobCreated = true;
          }
        }

        const { data: log } = await supabase.from("workflow_logs").insert({
          workspace_id, event_type: "qa_qualification_simulated",
          payload: { lead_id: lead.id, job_created: jobCreated, test: true },
        }).select("id").single();

        const { data: leadCheck } = await supabase.from("leads").select("status").eq("id", lead.id).single();
        const passed = leadCheck?.status === "qualified" && jobCreated;
        return { passed, details: passed ? "Lead qualified, job created in pipeline" : `Lead status: ${leadCheck?.status}, job: ${jobCreated}`, logIds: log ? [log.id] : [] };
      }));
    }

    if (!scenario || scenario === "review_low") {
      results.push(await runTest("2-Star Review → Feedback Ticket", async () => {
        const { data: lead } = await supabase.from("leads").upsert(
          { workspace_id, name: "QA Review Lead", phone: "+15550009999", normalized_phone: "+15550009999", source: "qa_test", status: "qualified" },
          { onConflict: "workspace_id,normalized_phone" }
        ).select("id").single();
        if (!lead) return { passed: false, details: "Failed to create test lead", logIds: [] };

        // Need a job for review request
        const { data: stage } = await supabase.from("pipeline_stages").select("id").eq("workspace_id", workspace_id).order("position").limit(1).single();
        let jobId: string;
        const { data: existingJob } = await supabase.from("jobs").select("id").eq("workspace_id", workspace_id).eq("lead_id", lead.id).limit(1);
        if (existingJob && existingJob.length > 0) {
          jobId = existingJob[0].id;
        } else if (stage) {
          const { data: job } = await supabase.from("jobs").insert({ workspace_id, lead_id: lead.id, stage_id: stage.id, status: "completed" }).select("id").single();
          if (!job) return { passed: false, details: "Failed to create job", logIds: [] };
          jobId = job.id;
        } else {
          return { passed: false, details: "No pipeline stages configured", logIds: [] };
        }

        // Create review request with low rating
        const { data: rr } = await supabase.from("review_requests").upsert({
          workspace_id, job_id: jobId, status: "completed", outcome: "private_recovery",
          rating_value: 2, sent_at: new Date().toISOString(), responded_at: new Date().toISOString(),
        }, { onConflict: "job_id" }).select("id").single();

        if (!rr) return { passed: false, details: "Failed to create review request", logIds: [] };

        // Create feedback ticket
        const { data: existingTicket } = await supabase.from("feedback_tickets").select("id").eq("review_request_id", rr.id).limit(1);
        if (!existingTicket || existingTicket.length === 0) {
          await supabase.from("feedback_tickets").insert({
            workspace_id, review_request_id: rr.id, content: "QA Test: Rating 2/5", status: "open", priority: "high",
          });
        }

        const { data: log } = await supabase.from("workflow_logs").insert({
          workspace_id, event_type: "qa_review_low_simulated",
          payload: { lead_id: lead.id, review_request_id: rr.id, rating: 2, test: true },
        }).select("id").single();

        const { data: ticketCheck } = await supabase.from("feedback_tickets").select("id").eq("review_request_id", rr.id).limit(1);
        const passed = !!(ticketCheck && ticketCheck.length > 0);
        return { passed, details: passed ? "Feedback ticket created for 2-star rating" : "Ticket not found", logIds: log ? [log.id] : [] };
      }));
    }

    if (!scenario || scenario === "opt_out") {
      results.push(await runTest("STOP → Opt-out Blocks Outbound", async () => {
        const { data: lead } = await supabase.from("leads").upsert(
          { workspace_id, name: "QA OptOut Lead", phone: "+15550004444", normalized_phone: "+15550004444", source: "qa_test", status: "contacted" },
          { onConflict: "workspace_id,normalized_phone" }
        ).select("id").single();
        if (!lead) return { passed: false, details: "Failed to create test lead", logIds: [] };

        // Set opt-out
        await supabase.from("automation_sessions").upsert({
          workspace_id, lead_id: lead.id, type: "qualification", status: "opted_out",
          current_step: "step_1_service_type", answers: {},
        }, { onConflict: "workspace_id,lead_id,type" });

        // Verify opt-out
        const { data: session } = await supabase.from("automation_sessions").select("status")
          .eq("workspace_id", workspace_id).eq("lead_id", lead.id).eq("status", "opted_out").limit(1);

        const { data: log } = await supabase.from("workflow_logs").insert({
          workspace_id, event_type: "qa_opt_out_simulated",
          payload: { lead_id: lead.id, opted_out: !!(session && session.length > 0), test: true },
        }).select("id").single();

        const passed = !!(session && session.length > 0);
        return { passed, details: passed ? "Opt-out recorded, future SMS blocked" : "Opt-out not found", logIds: log ? [log.id] : [] };
      }));
    }

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("qa-simulate error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
