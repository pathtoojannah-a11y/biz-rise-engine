import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestResult {
  table: string;
  operation: string;
  expected: "blocked" | "allowed";
  actual: "blocked" | "allowed";
  pass: boolean;
  detail?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

  const admin = createClient(supabaseUrl, serviceKey);

  const results: TestResult[] = [];
  const errors: string[] = [];

  try {
    // ===== SETUP: Create two test users and workspaces =====
    const testEmailA = `rls-test-a-${Date.now()}@nexaos-test.local`;
    const testEmailB = `rls-test-b-${Date.now()}@nexaos-test.local`;
    const testPassword = "TestPass123!";

    // Create users
    const { data: userAData, error: userAErr } = await admin.auth.admin.createUser({
      email: testEmailA, password: testPassword, email_confirm: true,
      user_metadata: { full_name: "Test User A" },
    });
    if (userAErr) throw new Error(`Create user A: ${userAErr.message}`);

    const { data: userBData, error: userBErr } = await admin.auth.admin.createUser({
      email: testEmailB, password: testPassword, email_confirm: true,
      user_metadata: { full_name: "Test User B" },
    });
    if (userBErr) throw new Error(`Create user B: ${userBErr.message}`);

    const userA = userAData.user;
    const userB = userBData.user;

    // Create workspaces via service role
    const { data: wsA } = await admin.from("workspaces").insert({
      name: "Test Workspace A", slug: `test-ws-a-${Date.now()}`, industry: "test", timezone: "UTC",
    }).select().single();

    const { data: wsB } = await admin.from("workspaces").insert({
      name: "Test Workspace B", slug: `test-ws-b-${Date.now()}`, industry: "test", timezone: "UTC",
    }).select().single();

    if (!wsA || !wsB) throw new Error("Failed to create test workspaces");

    // Add memberships
    await admin.from("workspace_members").insert([
      { workspace_id: wsA.id, user_id: userA.id, role: "owner", status: "active" },
      { workspace_id: wsB.id, user_id: userB.id, role: "owner", status: "active" },
    ]);

    // Create seed data in each workspace via service role
    const { data: locA } = await admin.from("locations").insert({
      workspace_id: wsA.id, name: "Location A",
    }).select().single();
    const { data: locB } = await admin.from("locations").insert({
      workspace_id: wsB.id, name: "Location B",
    }).select().single();

    const { data: leadA } = await admin.from("leads").insert({
      workspace_id: wsA.id, name: "Lead A", location_id: locA!.id,
    }).select().single();
    const { data: leadB } = await admin.from("leads").insert({
      workspace_id: wsB.id, name: "Lead B", location_id: locB!.id,
    }).select().single();

    await admin.from("pipeline_stages").insert([
      { workspace_id: wsA.id, name: "Stage A", position: 1 },
      { workspace_id: wsB.id, name: "Stage B", position: 1 },
    ]);

    const { data: jobA } = await admin.from("jobs").insert({
      workspace_id: wsA.id, lead_id: leadA!.id, status: "scheduled",
    }).select().single();
    const { data: jobB } = await admin.from("jobs").insert({
      workspace_id: wsB.id, lead_id: leadB!.id, status: "scheduled",
    }).select().single();

    await admin.from("conversations").insert([
      { workspace_id: wsA.id, lead_id: leadA!.id, channel: "sms", direction: "inbound", content: "test" },
      { workspace_id: wsB.id, lead_id: leadB!.id, channel: "sms", direction: "inbound", content: "test" },
    ]);
    await admin.from("calls").insert([
      { workspace_id: wsA.id, lead_id: leadA!.id, direction: "inbound", status: "missed" },
      { workspace_id: wsB.id, lead_id: leadB!.id, direction: "inbound", status: "missed" },
    ]);
    await admin.from("review_requests").insert([
      { workspace_id: wsA.id, job_id: jobA!.id, status: "pending" },
      { workspace_id: wsB.id, job_id: jobB!.id, status: "pending" },
    ]);
    await admin.from("websites").insert([
      { workspace_id: wsA.id, type: "existing", domain: "test-a.com" },
      { workspace_id: wsB.id, type: "existing", domain: "test-b.com" },
    ]);
    await admin.from("integrations").insert([
      { workspace_id: wsA.id, provider: "test" },
      { workspace_id: wsB.id, provider: "test" },
    ]);
    await admin.from("workflow_logs").insert([
      { workspace_id: wsA.id, event_type: "test" },
      { workspace_id: wsB.id, event_type: "test" },
    ]);

    // ===== Create authenticated clients =====
    const { data: sessA } = await admin.auth.admin.generateLink({ type: "magiclink", email: testEmailA });
    const { data: sessB } = await admin.auth.admin.generateLink({ type: "magiclink", email: testEmailB });

    // Sign in as each user
    const clientA = createClient(supabaseUrl, anonKey);
    const clientB = createClient(supabaseUrl, anonKey);
    
    await clientA.auth.signInWithPassword({ email: testEmailA, password: testPassword });
    await clientB.auth.signInWithPassword({ email: testEmailB, password: testPassword });

    // ===== CROSS-WORKSPACE ISOLATION TESTS =====
    const workspaceTables = [
      "locations", "leads", "pipeline_stages", "jobs", "conversations",
      "calls", "review_requests", "websites", "integrations", "workflow_logs",
      "workspace_members", "workspaces",
    ];

    for (const table of workspaceTables) {
      // User A tries to SELECT from workspace B
      const idCol = table === "workspaces" ? "id" : "workspace_id";
      const targetId = table === "workspaces" ? wsB.id : wsB.id;

      const { data: selectData } = await clientA.from(table).select("id").eq(idCol, targetId);
      const selectBlocked = !selectData || selectData.length === 0;
      results.push({
        table, operation: "SELECT", expected: "blocked",
        actual: selectBlocked ? "blocked" : "allowed",
        pass: selectBlocked,
        detail: selectBlocked ? undefined : `User A saw ${selectData?.length} rows in ${table} of workspace B`,
      });

      // User B tries to SELECT from workspace A
      const targetIdA = table === "workspaces" ? wsA.id : wsA.id;
      const { data: selectDataB } = await clientB.from(table).select("id").eq(idCol, targetIdA);
      const selectBlockedB = !selectDataB || selectDataB.length === 0;
      results.push({
        table, operation: "SELECT (reverse)", expected: "blocked",
        actual: selectBlockedB ? "blocked" : "allowed",
        pass: selectBlockedB,
      });
    }

    // ===== INSERT BYPASS TEST: User A tries to insert into workspace B =====
    const insertTests = [
      { table: "locations", payload: { workspace_id: wsB.id, name: "Hacked Location" } },
      { table: "leads", payload: { workspace_id: wsB.id, name: "Hacked Lead" } },
      { table: "integrations", payload: { workspace_id: wsB.id, provider: "hacked" } },
      { table: "websites", payload: { workspace_id: wsB.id, type: "existing", domain: "hacked.com" } },
    ];

    for (const { table, payload } of insertTests) {
      const { error: insertErr } = await clientA.from(table).insert(payload as any);
      const blocked = !!insertErr;
      results.push({
        table, operation: "INSERT (cross-workspace)", expected: "blocked",
        actual: blocked ? "blocked" : "allowed",
        pass: blocked,
        detail: blocked ? undefined : `User A inserted into ${table} of workspace B!`,
      });
    }

    // ===== ROLE PERMISSION TESTS =====
    // Create a staff user in workspace A
    const staffEmail = `rls-test-staff-${Date.now()}@nexaos-test.local`;
    const { data: staffUserData } = await admin.auth.admin.createUser({
      email: staffEmail, password: testPassword, email_confirm: true,
      user_metadata: { full_name: "Staff User" },
    });
    const staffUser = staffUserData!.user;

    await admin.from("workspace_members").insert({
      workspace_id: wsA.id, user_id: staffUser.id, role: "staff", status: "active",
    });

    const clientStaff = createClient(supabaseUrl, anonKey);
    await clientStaff.auth.signInWithPassword({ email: staffEmail, password: testPassword });

    // Staff can SELECT from their workspace
    const { data: staffLeads } = await clientStaff.from("leads").select("id").eq("workspace_id", wsA.id);
    results.push({
      table: "leads", operation: "SELECT (staff own workspace)", expected: "allowed",
      actual: staffLeads && staffLeads.length > 0 ? "allowed" : "blocked",
      pass: staffLeads != null && staffLeads.length > 0,
    });

    // Staff cannot UPDATE workspace settings
    await clientStaff.from("workspaces").update({ name: "Hacked" }).eq("id", wsA.id);
    // Verify data wasn't changed
    const { data: wsCheck } = await admin.from("workspaces").select("name").eq("id", wsA.id).single();
    const wsUpdateBlocked = wsCheck?.name !== "Hacked";
    results.push({
      table: "workspaces", operation: "UPDATE (staff blocked)", expected: "blocked",
      actual: wsUpdateBlocked ? "blocked" : "allowed",
      pass: wsUpdateBlocked,
    });

    // Staff cannot manage workspace_members
    const { error: staffMemberInsert } = await clientStaff.from("workspace_members").insert({
      workspace_id: wsA.id, user_id: staffUser.id, role: "admin", status: "active",
    } as any);
    // This should fail due to unique constraint or policy
    results.push({
      table: "workspace_members", operation: "INSERT (staff self-promote)", expected: "blocked",
      actual: staffMemberInsert ? "blocked" : "allowed",
      pass: !!staffMemberInsert,
    });

    // Staff cannot create integrations
    const { error: staffIntegration } = await clientStaff.from("integrations").insert({
      workspace_id: wsA.id, provider: "staff-hack",
    } as any);
    results.push({
      table: "integrations", operation: "INSERT (staff blocked)", expected: "blocked",
      actual: staffIntegration ? "blocked" : "allowed",
      pass: !!staffIntegration,
    });

    // Staff cannot delete locations
    await clientStaff.from("locations").delete().eq("workspace_id", wsA.id).eq("name", "Location A");
    // Verify data still exists
    const { data: locCheck } = await admin.from("locations").select("id").eq("workspace_id", wsA.id).eq("name", "Location A");
    const staffDeleteBlocked = locCheck != null && locCheck.length > 0;
    results.push({
      table: "locations", operation: "DELETE (staff blocked)", expected: "blocked",
      actual: staffDeleteBlocked ? "blocked" : "allowed",
      pass: staffDeleteBlocked,
    });

    // ===== BOOTSTRAP INTEGRITY: verify idempotent stages =====
    // Try inserting duplicate stages — should fail due to UNIQUE constraint
    const { error: dupeStage } = await admin.from("pipeline_stages").insert({
      workspace_id: wsA.id, name: "Stage A", position: 1,
    });
    results.push({
      table: "pipeline_stages", operation: "INSERT duplicate (idempotent)", expected: "blocked",
      actual: dupeStage ? "blocked" : "allowed",
      pass: !!dupeStage,
    });

    // Duplicate membership should fail
    const { error: dupeMember } = await admin.from("workspace_members").insert({
      workspace_id: wsA.id, user_id: userA.id, role: "owner", status: "active",
    });
    results.push({
      table: "workspace_members", operation: "INSERT duplicate member (idempotent)", expected: "blocked",
      actual: dupeMember ? "blocked" : "allowed",
      pass: !!dupeMember,
    });

    // ===== CLEANUP =====
    // Delete test data in reverse dependency order
    await admin.from("workflow_logs").delete().in("workspace_id", [wsA.id, wsB.id]);
    await admin.from("integrations").delete().in("workspace_id", [wsA.id, wsB.id]);
    await admin.from("websites").delete().in("workspace_id", [wsA.id, wsB.id]);
    await admin.from("feedback_tickets").delete().in("workspace_id", [wsA.id, wsB.id]);
    await admin.from("review_requests").delete().in("workspace_id", [wsA.id, wsB.id]);
    await admin.from("calls").delete().in("workspace_id", [wsA.id, wsB.id]);
    await admin.from("conversations").delete().in("workspace_id", [wsA.id, wsB.id]);
    await admin.from("jobs").delete().in("workspace_id", [wsA.id, wsB.id]);
    await admin.from("pipeline_stages").delete().in("workspace_id", [wsA.id, wsB.id]);
    await admin.from("leads").delete().in("workspace_id", [wsA.id, wsB.id]);
    await admin.from("locations").delete().in("workspace_id", [wsA.id, wsB.id]);
    await admin.from("workspace_members").delete().in("workspace_id", [wsA.id, wsB.id]);
    await admin.from("workspaces").delete().in("id", [wsA.id, wsB.id]);
    await admin.from("profiles").delete().in("id", [userA.id, userB.id, staffUser.id]);
    await admin.auth.admin.deleteUser(userA.id);
    await admin.auth.admin.deleteUser(userB.id);
    await admin.auth.admin.deleteUser(staffUser.id);

    // ===== SUMMARY =====
    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;
    const summary = {
      total: results.length,
      passed,
      failed,
      status: failed === 0 ? "ALL PASSED ✅" : `${failed} FAILED ❌`,
      results,
      failedTests: results.filter(r => !r.pass),
    };

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message,
      results,
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
